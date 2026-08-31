"""Update Twilio WhatsApp Sandbox webhook to point to EC2 instance."""
import os
from twilio.rest import Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

SID = os.getenv("TWILIO_ACCOUNT_SID")
TOKEN = os.getenv("TWILIO_AUTH_TOKEN")
EC2_URL = "http://16.16.141.23:8300/webhook/whatsapp"

client = Client(SID, TOKEN)

# Update the WhatsApp sandbox webhook
sandbox = client.messaging.v1.services.list(limit=1)

# For sandbox, we update via the sandbox resource directly
try:
    # Try sandbox API
    from twilio.rest import Client as TwilioClient
    incoming = client.incoming_phone_numbers.list(phone_number="+14155238886")
    if incoming:
        incoming[0].update(
            sms_url=EC2_URL,
            sms_method="POST",
        )
        print(f"Updated incoming number webhook to: {EC2_URL}")
    else:
        print("Sandbox number not found as incoming number")
except Exception as e:
    print(f"Incoming number update error: {e}")

# Also try the messaging service / sandbox approach
try:
    sandbox_resp = client.messaging.v1.services.list(limit=5)
    for svc in sandbox_resp:
        print(f"  Messaging Service: {svc.friendly_name} ({svc.sid})")
except Exception as e:
    print(f"Messaging services: {e}")

print(f"\nIMPORTANT: Go to https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn")
print(f"Set the webhook URL to: {EC2_URL}")
print("Method: HTTP POST")
