# Career OS

Personal career operating system for tracking jobs, scholarships, mail, and deadlines.

**Live demo:** [career-os-irum-naureen-s-projects.vercel.app](https://career-os-irum-naureen-s-projects.vercel.app)

## Features

- Home dashboard with noon and evening digests
- Read-only Gmail and Outlook sync
- Inbox with priority tags, bulk hide, and sender blocklist
- Job alerts tab for recruiting mail
- Jobs, scholarships, coursework, subscriptions, and contacts
- Quick capture for manual entries
- AI-drafted actions with approve-before-execute
- Deadline reminders at 7, 3, and 1 days out

## Stack

Next.js 15, TypeScript, Tailwind CSS, Supabase, Vercel.

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project
- Gmail OAuth credentials ([Google Cloud Console](https://console.cloud.google.com))

### Install

```bash
git clone https://github.com/irum13/career-os.git
cd career-os
npm install
cp .env.example .env.local
```

### Database

Run the SQL migrations in order in the Supabase SQL Editor:

1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_alerts_category.sql`
3. `supabase/migrations/003_sender_blocklist.sql`

Enable email auth under **Authentication → Providers**.

### Configuration

Copy your Supabase URL, anon key, and service role key into `.env.local`. See `.env.example` for the full list of variables.

For Gmail OAuth, set the redirect URI to:

```
http://localhost:3000/api/auth/gmail/callback
```

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to [Vercel](https://vercel.com) and import environment variables from `.env.local`. Set `NEXT_PUBLIC_APP_URL` and OAuth redirect URIs to your production domain. Add the same domain to Supabase **Authentication → URL Configuration** and to your Google OAuth client.

Mail sync runs on demand from **Settings → Sync mail now**.

## Security

- Read-only mail access — nothing is sent or deleted from your mailbox
- Hide and dismiss actions only affect Career OS, not Gmail or Outlook
- Never commit `.env.local` or API secrets

## License

MIT — see [LICENSE](LICENSE).
