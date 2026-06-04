"""
Google Cloud Text-to-Speech service.

Converts Vietnamese AI interpretation text to speech using SSML
for natural pauses and prosody fitting a Tử Vi reading context.
"""

import base64
import logging
import re

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_TTS_URL = "https://texttospeech.googleapis.com/v1/text:synthesize"

# Neural2 voices: A = female, D = male
VOICE_OPTIONS = {
    "female": "vi-VN-Neural2-A",
    "male":   "vi-VN-Neural2-D",
}
DEFAULT_VOICE = "female"


def _text_to_ssml(text: str) -> str:
    """Convert plain Vietnamese prose to SSML with pauses and slow prosody."""
    text = text.strip()

    paragraphs = re.split(r"\n\n+|\n", text)

    processed = []
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        # Sentence-ending punctuation → pause after
        para = re.sub(r"([.!?])\s+", r'\1<break time="550ms"/> ', para)
        # Trailing sentence end (last char)
        para = re.sub(r"([.!?])$", r'\1<break time="550ms"/>', para)
        # Comma / colon → short pause
        para = re.sub(r"([,:])\s+", r'\1<break time="220ms"/> ', para)
        # Em dash / en dash → dramatic pause
        para = re.sub(r"\s*[—–]\s*", r'<break time="400ms"/>— ', para)
        # Semicolon
        para = re.sub(r";\s+", r';<break time="320ms"/> ', para)
        processed.append(para)

    body = '<break time="750ms"/>'.join(processed)

    # Slightly slower and lower pitched for a solemn, mystical tone
    return f'<speak><prosody rate="0.88" pitch="-1.5st">{body}</prosody></speak>'


class TTSService:

    @staticmethod
    async def synthesize(text: str, voice: str = DEFAULT_VOICE) -> bytes:
        """Return MP3 audio bytes for the given text."""
        if not settings.GOOGLE_TTS_API_KEY:
            raise ValueError("GOOGLE_TTS_API_KEY not configured")

        ssml = _text_to_ssml(text)
        voice_name = VOICE_OPTIONS.get(voice, VOICE_OPTIONS[DEFAULT_VOICE])

        payload = {
            "input": {"ssml": ssml},
            "voice": {
                "languageCode": "vi-VN",
                "name": voice_name,
            },
            "audioConfig": {
                "audioEncoding": "MP3",
                "effectsProfileId": ["headphone-class-device"],
            },
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.post(
                f"{_TTS_URL}?key={settings.GOOGLE_TTS_API_KEY}",
                json=payload,
            )
            resp.raise_for_status()

        audio_b64: str = resp.json()["audioContent"]
        return base64.b64decode(audio_b64)
