# KIN Communications Hub

A comprehensive communications platform built with Next.js 14, featuring Twilio Voice integration, contact management, and call history tracking.

## Features

- **Contact Management**: Full CRUD operations with search, filtering, and grouping
- **Twilio Voice Integration**: Outbound calling, inbound call handling, and call recording
- **Call History**: Complete call tracking with recording playback and transcription
- **Real-time Updates**: Webhook-based call status updates and recording processing
- **Authentication**: Secure user authentication with NextAuth.js
- **Responsive UI**: Modern interface built with Tailwind CSS and shadcn/ui

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Voice**: Twilio Programmable Voice API
- **Authentication**: NextAuth.js with credentials provider
- **Database**: PostgreSQL with Prisma migrations

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   ```
   
   Configure the following required variables:
   - `DATABASE_URL`: PostgreSQL connection string
   - `NEXTAUTH_URL`: Your application URL
   - `NEXTAUTH_SECRET`: Random secret for NextAuth
   - `TWILIO_ACCOUNT_SID`: Your Twilio Account SID
   - `TWILIO_AUTH_TOKEN`: Your Twilio Auth Token
   - `TWILIO_PHONE_NUMBER`: Your Twilio phone number

3. **Set up the database**:
   ```bash
   npm run prisma:generate
   npm run prisma:migrate
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Access the application**: http://localhost:3000

## Twilio Configuration

### Webhook Setup

Configure the following webhook URLs in your Twilio console:

1. **Voice Webhook**: `https://yourdomain.com/api/webhooks/twilio/voice`
   - Handles inbound calls and returns TwiML responses

2. **Status Callback**: `https://yourdomain.com/api/webhooks/twilio/status`
   - Receives call status updates (ringing, answered, completed, etc.)

3. **Recording Callback**: `https://yourdomain.com/api/webhooks/twilio/recording`
   - Processes completed call recordings

4. **Transcription Callback**: `https://yourdomain.com/api/webhooks/twilio/transcription`
   - Handles voicemail transcriptions (future feature)

### Phone Number Configuration

1. Purchase a Twilio phone number
2. Set the voice webhook URL to your application's voice endpoint
3. Enable call recording and transcription if desired

## API Endpoints

### Calls
- `GET /api/calls` - List calls with search and filtering
- `GET /api/calls/[id]` - Get call details
- `POST /api/calls/[id]/control` - Control active calls (mute, hold, hangup, transfer)

### Contacts
- `GET /api/contacts` - List contacts with search and filtering
- `POST /api/contacts` - Create new contact
- `PUT /api/contacts/[id]` - Update contact
- `DELETE /api/contacts/[id]` - Delete contact
- `POST /api/contacts/[id]/call` - Initiate outbound call

### Webhooks
- `POST /api/webhooks/twilio/voice` - Handle inbound calls
- `POST /api/webhooks/twilio/status` - Process call status updates
- `POST /api/webhooks/twilio/recording` - Process recording completion
- `POST /api/webhooks/twilio/transcription` - Process transcription completion

## Data Fetching Strategy

The application uses lightweight, manual `fetch` calls inside custom hooks with consistent loading/error state handling and explicit refresh methods. This approach provides:

- Simple state management without additional dependencies
- Explicit control over when data is fetched
- Consistent error handling across the application
- Easy debugging and testing

Future enhancements could include React Query for advanced caching and real-time invalidation if needed.

## Development

### Database Migrations

When making schema changes:

```bash
# Create a new migration
npm run prisma:migrate

# Reset the database (development only)
npm run prisma:reset
```

### Code Structure

- `src/app/` - Next.js 14 app router pages and API routes
- `src/components/` - Reusable UI components
- `src/lib/` - Utility functions, database client, and business logic
- `src/types/` - TypeScript type definitions
- `prisma/` - Database schema and migrations

## Deployment

1. Set up a PostgreSQL database
2. Configure environment variables for production
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Railway, etc.)
5. Update Twilio webhook URLs to point to your production domain

## Troubleshooting

### Common Issues

1. **Webhook signature verification fails**: Ensure your `NEXTAUTH_URL` matches your actual domain
2. **Calls not being created**: Check Twilio credentials and phone number configuration
3. **Recordings not appearing**: Verify recording callback URL is configured in Twilio
4. **Database connection issues**: Check your `DATABASE_URL` format and database accessibility

### Logs

Check the application logs for detailed error messages. Webhook processing errors are logged with full context for debugging.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.
