"""Start ngrok tunnel for WhatsApp bot."""
from pyngrok import ngrok
import time

tunnel = ngrok.connect(8300, "http")
print(f"\n{'='*60}")
print(f"  NGROK TUNNEL ACTIVE")
print(f"  Public URL: {tunnel.public_url}")
print(f"  Webhook:    {tunnel.public_url}/webhook/whatsapp")
print(f"{'='*60}\n")
print("Set this webhook URL in Twilio Console.")
print("Press Ctrl+C to stop the tunnel.\n")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    print("\nShutting down tunnel...")
    ngrok.disconnect(tunnel.public_url)
    ngrok.kill()
