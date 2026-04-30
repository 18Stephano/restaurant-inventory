# Restaurant Daily Inventory

Mobile-first web app for daily inventory checks. Employees check items on their phone, data saves to Supabase, manager reviews via dashboard.

---

## Stack

- **Next.js 14** (App Router)
- **Supabase** (database + auto REST API)
- **Vercel** (deployment)

---

## Setup in 4 steps

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste and run `supabase/schema.sql`
3. Copy your **Project URL** and **anon public key** from Settings → API

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in your values:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_DASHBOARD_PIN=1234
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Add the same env vars in Vercel dashboard → Settings → Environment Variables.

---

## Customizing

**Add/remove employees** → edit `lib/items.js` → `EMPLOYEES` array

**Add/remove inventory items** → edit `lib/items.js` → `CATEGORIES` array

**Change dashboard PIN** → update `NEXT_PUBLIC_DASHBOARD_PIN` env var

---

## App structure

```
/                   → Employee selects name
/inventory          → Daily checklist
/dashboard          → Manager view (PIN protected)
```
