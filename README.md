# Board — Personal Vision Board

An infinite canvas web app for collecting images, files, links, and notes. Organize them into named groups, search across everything, and let old items auto-expire.

Built with **Next.js 15**, **tldraw**, and **Supabase**.

---

## Quick Start

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project.
2. In the SQL Editor, run the contents of [`supabase/schema.sql`](./supabase/schema.sql). This creates:
   - `boards`, `groups`, and `cards` tables with Row Level Security
   - A trigger that auto-creates a default board on user signup
   - A `card-files` Storage bucket with user-scoped access policies

### 2. Configure Environment Variables

Copy the example file and fill in your Supabase credentials:

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: tldraw license key (removes watermark in production)
NEXT_PUBLIC_TLDRAW_LICENSE_KEY=

# For the auto-expiry cron job
CRON_SECRET=any-random-string
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

You can find your keys in the Supabase Dashboard → Settings → API.

### 3. Install and Run

```bash
cd board-app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with an email and password to get started.

### 4. Enable Auth (if using magic links)

In Supabase Dashboard → Authentication → URL Configuration, add:

```
http://localhost:3000/auth/callback
```

For production, also add your Vercel domain:

```
https://your-app.vercel.app/auth/callback
```

---

## Deploying to Vercel

1. Push the `board-app` directory to a GitHub repo.
2. Import the repo in [vercel.com](https://vercel.com).
3. Set environment variables in Vercel's project settings:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_TLDRAW_LICENSE_KEY` (optional)
4. Deploy. Vercel will automatically set up the daily cron job from `vercel.json`.

---

## Features

| Feature | Status |
|---------|--------|
| Infinite pan/zoom canvas (tldraw) | ✅ |
| Note cards (click/paste text) | ✅ |
| Link cards with OG preview | ✅ |
| Image upload with thumbnail | ✅ |
| File upload | ✅ |
| Multi-select → Group cards | ✅ |
| Sidebar navigation (groups, recent) | ✅ |
| Search (titles, text, filenames) | ✅ |
| Auto-expiry (30d default) | ✅ |
| Pin to make permanent | ✅ |
| Context menu (expiry, delete, pin) | ✅ |
| Responsive / mobile web | ✅ |
| Auth (email/password + magic link) | ✅ |
| Daily cleanup cron | ✅ |

---

## Architecture

```
Next.js App Router
├── Server Components — Auth, data fetching
├── Client Components — tldraw canvas, sidebar, search
├── API Routes
│   ├── /api/unfurl — OG metadata scraping
│   └── /api/cron/cleanup — Daily expired card cleanup
└── Supabase
    ├── Auth (email/password + magic link)
    ├── Postgres (boards, cards, groups + RLS)
    └── Storage (card-files bucket)
```

---

## License

Private / personal use.
