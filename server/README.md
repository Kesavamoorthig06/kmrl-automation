# KMRL Server

Backend server for KMRL Metro Rail Management System with SMS and Email notifications.

## Features

- **SMS Notifications**: Send deployment alerts via Twilio
- **Email Notifications**: Send deployment alerts via SMTP or Ethereal (dev)
- **Crew Management**: Configure multiple crew roles with contact information
- **Health Check**: API endpoint for monitoring

## Installation

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp env.example .env
   # Edit .env with your credentials
   ```

3. **Start the server:**
   ```bash
   # Development (auto-restart on changes)
   npm run dev
   
   # Production
   npm start
   ```

## Environment Configuration

Create a `.env` file from `env.example` with your credentials:

### Required for SMS (Twilio)
- `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
- `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token  
- `TWILIO_FROM`: Your Twilio phone number (E.164 format: +1XXXXXXXXXX)

### Optional for Email (SMTP)
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP port (default: 587)
- `SMTP_USER`: SMTP username
- `SMTP_PASS`: SMTP password

### Crew Configuration
- `CREW_ROLES`: Comma-separated crew roles (e.g., "loco-pilot,cleaning,rollout")
- `CREW_PHONES`: Comma-separated phone numbers (E.164 format)
- `CREW_EMAILS`: Comma-separated email addresses

## API Endpoints

### POST /api/deploy
Deploy trains and notify crew members.

**Request:**
```json
{
  "trains": ["R-01", "R-02", "R-03"]
}
```

**Response:**
```json
{
  "success": true,
  "deployed": ["R-01", "R-02", "R-03"],
  "timestamp": "2025-09-11T12:00:00.000Z",
  "outcomes": [
    {
      "role": "loco-pilot",
      "phone": "+91XXXXXXXXXX",
      "email": "lp@example.com",
      "sms": { "success": true, "sid": "SMxxxx", "to": "+91XXXXXXXXXX" },
      "emailResult": { "success": true, "messageId": "<...>", "preview": "https://ethereal.email/..." }
    }
  ]
}
```

### GET /api/health
Health check endpoint.

**Response:**
```json
{
  "ok": true,
  "time": "2025-09-11T12:00:00.000Z"
}
```

## Twilio Setup

1. **Create Twilio Account**: Sign up at [twilio.com](https://twilio.com)
2. **Get Credentials**: Find Account SID and Auth Token in Twilio Console
3. **Buy Phone Number**: Purchase a phone number for sending SMS
4. **Verify Numbers**: On trial accounts, verify recipient phone numbers

### Twilio Trial Limitations
- Can only send SMS to verified phone numbers
- Limited number of messages per month
- Upgrade to paid account for production use

## Email Configuration

### Option 1: SMTP (Production)
Configure with your email provider:
- Gmail SMTP
- Mailtrap (for testing)
- SendGrid
- AWS SES

### Option 2: Ethereal (Development)
If no SMTP config provided, uses Ethereal test accounts:
- No real emails sent
- Preview URLs generated for testing
- Perfect for development

## Security Considerations

### Development
- Use environment variables for secrets
- Never commit `.env` file to git
- Use Twilio trial account for testing

### Production
- Store secrets in secure vault/secrets manager
- Add API authentication (JWT/API keys)
- Implement rate limiting
- Add request validation
- Use HTTPS
- Monitor and log all deployments

## Troubleshooting

### SMS Issues
- Verify Twilio credentials in `.env`
- Check phone number format (E.164: +1XXXXXXXXXX)
- Ensure recipient numbers are verified (trial accounts)
- Check Twilio console for message status

### Email Issues
- Verify SMTP credentials
- Check firewall/network access to SMTP server
- For Ethereal: check console for preview URLs
- Test with simple email first

### Server Issues
- Check port availability (default: 4000)
- Verify all dependencies installed
- Check console logs for errors
- Test health endpoint: `GET /api/health`

## Example Usage

### From Frontend (React)
```javascript
const deployTrains = async (trainIds) => {
  try {
    const response = await fetch('http://localhost:4000/api/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trains: trainIds })
    });
    
    const result = await response.json();
    console.log('Deployment result:', result);
    return result;
  } catch (error) {
    console.error('Deployment failed:', error);
  }
};

// Usage
deployTrains(['R-01', 'R-02', 'R-03']);
```

### From Command Line
```bash
curl -X POST http://localhost:4000/api/deploy \
  -H "Content-Type: application/json" \
  -d '{"trains": ["R-01", "R-02"]}'
```

## Development

- Server runs on `http://localhost:4000` by default
- CORS enabled for frontend integration
- Auto-restart with `npm run dev`
- Logs crew configuration on startup
- Detailed error logging for debugging
