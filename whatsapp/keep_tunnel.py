"""Keep ngrok tunnel alive for WhatsApp bot on port 8300."""
import time
from pyngrok import ngrok

# Kill any stale tunnels first
try:
    ngrok.kill()
    time.sleep(2)
except Exception:
    pass

tunnel = ngrok.connect(8300, "http")
print(f"TUNNEL ACTIVE: {tunnel.public_url}")
print(f"WEBHOOK URL:   {tunnel.public_url}/webhook/whatsapp")
print("Keep this running. Ctrl+C to stop.")

try:
    while True:
        time.sleep(1)
except KeyboardInterrupt:
    ngrok.kill()
    print("Tunnel stopped.")
