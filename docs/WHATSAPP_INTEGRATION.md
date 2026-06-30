# WhatsApp Integration with Baileys

This project integrates with WhatsApp using the Baileys library to enable WhatsApp Web messaging for the MMO game.

## Overview

- **Adapter**: `src/Adapters/WhatsAppAdapter.ts`
- **Service**: `src/Services/WhatsAppService.ts`
- **Server**: `src/server.ts`
- **Library**: Baileys (WhatsApp Web API)

## Setup

### 1. Install Dependencies

```bash
npm install baileys @whiskeysockets/baileys @hapi/boom pino
```

### 2. Configure Environment Variables

Create a `.env` file based on `.env.example`:

```env
# WhatsApp Baileys Configuration
WHATSAPP_SESSION_ID=ecaasia_mmo
WHATSAPP_AUTH_PATH=./auth

# Server Configuration
PORT=3000
```

### 3. Start the Server

```bash
npm run server
```

The server will:
- Initialize the database
- Connect to WhatsApp Web (Baileys)
- Start the game scheduler
- Display QR code in terminal for WhatsApp authentication

### 4. Authenticate WhatsApp

1. Start the server: `npm run server`
2. A QR code will appear in the terminal
3. Open WhatsApp on your phone
4. Go to Settings > Linked Devices
5. Scan the QR code
6. The bot will be connected to your WhatsApp

## Usage

Once authenticated, users can interact with the game via WhatsApp using these commands:

**Auth:**
- `/register <username> <password>` - Create account
- `/login <username> <password>` - Login
- `/characters` - List your characters

**Movement:**
- `/look` - See your surroundings
- `/go <place>` - Travel to a place
- `/cancel` - Cancel current travel

**Combat:**
- `/attack` - Attack enemy
- `/defend` - Defend against enemy
- `/flee` - Flee from combat

**Character:**
- `/status` - View your character
- `/inventory` - Check your items

## Architecture

```
WhatsApp Message
    ↓
Baileys (WhatsApp Web)
    ↓
WhatsAppAdapter.parseInbound()
    ↓
WhatsAppService.handleMessage()
    ↓
InboundProcessor.processMessage()
    ↓
AuthService.getUserByPlatformId()
    ↓
Command Handler (Travel, Combat, etc.)
    ↓
OutboxService.queueMessage()
    ↓
WhatsAppAdapter.sendMessage()
    ↓
Baileys
    ↓
WhatsApp Message to User
```

## PlatformLink

WhatsApp phone numbers are mapped to users via the `PlatformLink` entity:

- `platform`: "whatsapp"
- `platformId`: Phone number (e.g., "5511999999999")
- `userId`: User ID
- `isActive`: Boolean

When a user logs in via WhatsApp, their phone number is automatically linked to their account.

## Authentication Storage

Baileys stores authentication credentials in the `auth` directory by default:

```
auth/
└── ecaasia_mmo/
    ├── creds.json
    └── app-state.json
```

These files are generated automatically after scanning the QR code and should not be manually edited.

## Testing

### Local Testing with CLI

```bash
# Seed test data
npm run seed

# Test via CLI
npm run cli
```

### WhatsApp Testing

1. Start the server: `npm run server`
2. Scan the QR code displayed in the terminal
3. Send a message to your WhatsApp number
4. The server will process the message and respond

## Health Check

```bash
curl http://localhost:3000/health
```

Response:
```json
{
  "status": "ok",
  "whatsapp": true
}
```

## Troubleshooting

### QR Code Not Appearing

- Check if `WHATSAPP_SESSION_ID` is set in `.env`
- Ensure the auth directory is writable
- Check server logs for errors

### Connection Lost

- Baileys will automatically reconnect
- Check your internet connection
- If reconnection fails, delete the auth directory and restart server to scan QR again

### Messages Not Sending

- Check if WhatsApp is connected
- Verify phone number format (include country code)
- Check rate limits (1 second between messages)

### Authentication Failed

- Delete the `auth` directory
- Restart the server
- Scan the QR code again

## Security Notes

- Never commit the `auth` directory (contains WhatsApp credentials)
- Use environment variables in production
- Protect the auth directory from unauthorized access
- Implement rate limiting for production
- Validate all incoming messages

## Production Deployment

For production deployment:

1. Use a reverse proxy (nginx)
2. Enable HTTPS
3. Use environment-specific configuration
4. Implement proper logging
5. Set up monitoring
6. Use a process manager (PM2)
7. Backup auth directory regularly
8. Use a persistent storage for auth files

## Baileys Features

- Direct WhatsApp Web connection (no external API needed)
- QR code authentication
- Auto-reconnection
- Message handling
- Media support (images, audio, documents)
- Group chat support
- Read receipts
- Presence updates

## Advantages Over External APIs

- No external API service dependency
- No monthly fees
- Direct WhatsApp Web connection
- Full control over the connection
- No rate limits from external services
- Open source and free
