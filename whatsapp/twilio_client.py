"""
Twilio WhatsApp client — send text and media replies.

Uses the Twilio REST API (via `twilio` SDK) to send messages back
to the user on WhatsApp.
"""

from __future__ import annotations

import logging
from twilio.rest import Client

from config import TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_WHATSAPP_FROM, MAX_REPLY_LENGTH

logger = logging.getLogger(__name__)

_client: Client | None = None


def _get_client() -> Client:
    """Lazy-initialised Twilio client."""
    global _client
    if _client is None:
        if not TWILIO_ACCOUNT_SID or not TWILIO_AUTH_TOKEN:
            raise RuntimeError(
                "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN must be set in env"
            )
        _client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        logger.info("Twilio client initialised (SID=%s…)", TWILIO_ACCOUNT_SID[:8])
    return _client


def send_reply(to: str, body: str, media_url: str | None = None) -> str:
    """
    Send a WhatsApp reply.

    Parameters
    ----------
    to : str
        Recipient in ``whatsapp:+<number>`` format.
    body : str
        Message text (auto-truncated to ``MAX_REPLY_LENGTH``).
    media_url : str | None
        Optional media URL to attach.

    Returns
    -------
    str
        Twilio message SID.
    """
    client = _get_client()

    # Truncate if needed
    if len(body) > MAX_REPLY_LENGTH:
        body = body[: MAX_REPLY_LENGTH - 3] + "…"

    kwargs: dict = dict(
        from_=TWILIO_WHATSAPP_FROM,
        to=to,
        body=body,
    )
    if media_url:
        kwargs["media_url"] = [media_url]

    msg = client.messages.create(**kwargs)
    logger.info("Reply sent → %s  SID=%s", to, msg.sid)
    return msg.sid


def send_multi_part(to: str, text: str) -> list[str]:
    """
    Split a long reply into multiple WhatsApp messages if needed.

    Returns list of message SIDs.
    """
    sids: list[str] = []
    while text:
        chunk = text[:MAX_REPLY_LENGTH]
        text = text[MAX_REPLY_LENGTH:]
        sids.append(send_reply(to, chunk))
    return sids
