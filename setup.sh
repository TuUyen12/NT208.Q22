#!/usr/bin/env bash
# setup.sh — bootstrap a fresh Ubuntu/Debian VM to run this project
# and register it as a GitHub Actions self-hosted runner.
#
# Usage:
#   chmod +x setup.sh
#   sudo ./setup.sh
#
# Then run the runner registration step at the bottom as the non-root user.

set -euo pipefail

RUNNER_USER="${RUNNER_USER:-$(logname 2>/dev/null || echo ubuntu)}"
RUNNER_VERSION="2.317.0"

echo "==> [1/6] System packages"
apt-get update -qq
apt-get install -y -qq \
  curl git ca-certificates gnupg lsb-release \
  build-essential libssl-dev libffi-dev \
  python3 python3-venv pipx \
  unzip jq

echo "==> [2/6] Docker Engine"
if ! command -v docker &>/dev/null; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
  chmod a+r /etc/apt/keyrings/docker.gpg
  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
    https://download.docker.com/linux/ubuntu \
    $(lsb_release -cs) stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null
  apt-get update -qq
  apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-compose-plugin
  systemctl enable --now docker
  echo "Docker installed."
else
  echo "Docker already installed, skipping."
fi

echo "==> [3/6] Add $RUNNER_USER to docker group"
usermod -aG docker "$RUNNER_USER"
# Restart runner service NOW if it is already running so it picks up the new group.
# (A process must be restarted to inherit group changes — 'newgrp' only works interactively.)
RUNNER_SVC="$(systemctl list-unit-files --type=service --no-legend 2>/dev/null \
  | awk '/^actions\.runner\./{print $1}' | head -1)"
if [ -n "$RUNNER_SVC" ]; then
  echo "  Restarting $RUNNER_SVC to apply docker group..."
  systemctl restart "$RUNNER_SVC"
fi

echo "==> [4/6] Node.js 20 (for frontend lint)"
if ! command -v node &>/dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y -qq nodejs
  echo "Node.js $(node -v) installed."
else
  echo "Node.js $(node -v) already installed, skipping."
fi

echo "==> [5/6] Python tools (ruff for CI lint)"
# pipx installs CLI tools into isolated venvs — avoids PEP 668 externally-managed-environment error
PIPX_HOME=/opt/pipx PIPX_BIN_DIR=/usr/local/bin pipx install ruff
echo "ruff $(ruff --version) installed."

echo "==> [6/6] GitHub Actions self-hosted runner"
RUNNER_HOME="/home/${RUNNER_USER}/actions-runner"

if [ -d "$RUNNER_HOME" ]; then
  echo "Runner directory already exists at $RUNNER_HOME, skipping download."
else
  mkdir -p "$RUNNER_HOME"
  ARCH="$(uname -m)"
  case "$ARCH" in
    x86_64)  RUNNER_ARCH="x64" ;;
    aarch64) RUNNER_ARCH="arm64" ;;
    *)        echo "Unsupported architecture: $ARCH"; exit 1 ;;
  esac

  RUNNER_PKG="actions-runner-linux-${RUNNER_ARCH}-${RUNNER_VERSION}.tar.gz"
  curl -fsSL \
    "https://github.com/actions/runner/releases/download/v${RUNNER_VERSION}/${RUNNER_PKG}" \
    -o "/tmp/${RUNNER_PKG}"
  tar xzf "/tmp/${RUNNER_PKG}" -C "$RUNNER_HOME"
  chown -R "$RUNNER_USER:$RUNNER_USER" "$RUNNER_HOME"
  echo "Runner downloaded to $RUNNER_HOME"
fi

echo ""
echo "============================================================"
echo " Setup complete!"
echo " Next steps (run as $RUNNER_USER, NOT root):"
echo ""
echo "  1. Get a runner token from:"
echo "     https://github.com/<org>/<repo>/settings/actions/runners/new"
echo ""
echo "  2. Register the runner:"
echo "     cd ~/actions-runner"
echo "     ./config.sh --url https://github.com/<org>/<repo> \\"
echo "                 --token <TOKEN> \\"
echo "                 --name \$(hostname) \\"
echo "                 --labels self-hosted,linux \\"
echo "                 --unattended"
echo ""
echo "  3. Install and start as a systemd service:"
echo "     sudo ~/actions-runner/svc.sh install $RUNNER_USER"
echo "     sudo ~/actions-runner/svc.sh start"
echo ""
echo "  4. Verify the runner appears as 'Idle' in GitHub."
echo ""
echo "  5. Copy your .env so the runner can access it:"
echo "     sudo cp /home/\$(logname)/.env /home/runner/.env"
echo "     sudo chown runner:runner /home/runner/.env"
echo "     sudo chmod 600 /home/runner/.env"
echo "============================================================"