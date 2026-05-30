import { useEffect, useRef, useState } from "react";
import { notificationService } from "../services/notificationService";

const C = {
  bg: "#1a1d2e",
  surface: "rgba(255,255,255,.04)",
  border: "rgba(237,177,255,.12)",
  primary: "#edb1ff",
  onSurface: "#f0e6ff",
  onSurfaceVariant: "#9e8daa",
};

const TYPE_ICON = {
  luu_sao: "auto_awesome",
  system: "notifications",
  info: "info",
};

function timeAgo(iso) {
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60) return "vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const ref = useRef(null);

  // Poll unread count every 60s
  useEffect(() => {
    let cancelled = false;
    async function fetchCount() {
      try {
        const data = await notificationService.unreadCount();
        if (!cancelled) setUnread(data.count);
      } catch {
        // silently ignore — user may not be logged in yet
      }
    }
    fetchCount();
    const id = setInterval(fetchCount, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Close on outside click
  useEffect(() => {
    function onDown(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  async function handleOpen() {
    if (open) { setOpen(false); return; }
    setOpen(true);
    setLoading(true);
    try {
      const data = await notificationService.list();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAll() {
    await notificationService.markAllRead();
    setUnread(0);
    setItems(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function handleMarkOne(id) {
    await notificationService.markRead(id);
    setItems(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnread(prev => Math.max(0, prev - 1));
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        style={{
          position: "relative", background: "none", border: "none",
          cursor: "pointer", padding: "4px", display: "flex",
          alignItems: "center", justifyContent: "center",
          color: open ? C.primary : C.onSurfaceVariant,
          transition: "color .2s",
        }}
        title="Thông báo"
      >
        <span className="material-symbols-outlined" style={{ fontSize: "22px" }}>
          {unread > 0 ? "notifications_active" : "notifications"}
        </span>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: 0, right: 0,
            background: "#e53935", color: "#fff",
            borderRadius: "50%", fontSize: "10px", fontWeight: 700,
            minWidth: "16px", height: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "0 3px", lineHeight: 1,
          }}>
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 10px)", right: 0,
          width: "320px", maxHeight: "420px",
          background: "#1a1d2e",
          border: `1px solid ${C.border}`,
          borderRadius: "12px",
          boxShadow: "0 8px 32px rgba(0,0,0,.5)",
          zIndex: 200,
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "12px 16px",
            borderBottom: `1px solid ${C.border}`,
          }}>
            <span style={{ fontWeight: 700, fontSize: "0.875rem", color: C.onSurface }}>
              Thông báo
            </span>
            {unread > 0 && (
              <button onClick={handleMarkAll} style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "0.75rem", color: C.primary,
              }}>
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* List */}
          <div style={{ overflowY: "auto", flex: 1 }}>
            {loading && (
              <div style={{ padding: "24px", textAlign: "center", color: C.onSurfaceVariant, fontSize: "0.85rem" }}>
                Đang tải…
              </div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ padding: "32px 16px", textAlign: "center", color: C.onSurfaceVariant, fontSize: "0.85rem" }}>
                <span className="material-symbols-outlined" style={{ fontSize: "32px", display: "block", marginBottom: "8px", opacity: 0.5 }}>
                  notifications_off
                </span>
                Chưa có thông báo nào
              </div>
            )}
            {!loading && items.map(n => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkOne(n.id)}
                style={{
                  display: "flex", gap: "12px", padding: "12px 16px",
                  borderBottom: `1px solid rgba(255,255,255,.04)`,
                  cursor: n.is_read ? "default" : "pointer",
                  background: n.is_read ? "transparent" : "rgba(237,177,255,.04)",
                  transition: "background .15s",
                }}
                onMouseEnter={e => { if (!n.is_read) e.currentTarget.style.background = "rgba(237,177,255,.08)"; }}
                onMouseLeave={e => { if (!n.is_read) e.currentTarget.style.background = "rgba(237,177,255,.04)"; }}
              >
                <span className="material-symbols-outlined" style={{
                  fontSize: "20px", flexShrink: 0, marginTop: "2px",
                  color: n.is_read ? C.onSurfaceVariant : C.primary,
                }}>
                  {TYPE_ICON[n.notif_type] || "notifications"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: "0.82rem", fontWeight: n.is_read ? 400 : 600,
                    color: n.is_read ? C.onSurfaceVariant : C.onSurface,
                    marginBottom: "2px",
                  }}>
                    {n.title}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: C.onSurfaceVariant, lineHeight: 1.5 }}>
                    {n.body}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "rgba(158,141,170,.6)", marginTop: "4px" }}>
                    {timeAgo(n.created_at)}
                  </div>
                </div>
                {!n.is_read && (
                  <div style={{
                    width: "7px", height: "7px", borderRadius: "50%",
                    background: C.primary, flexShrink: 0, marginTop: "6px",
                  }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
