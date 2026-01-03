# Push Notification Setup Guide

This guide explains how to set up background push notifications for DailyDash.

## Prerequisites

1. **Supabase CLI** installed: `npm install -g supabase`
2. Access to your **Supabase Dashboard**

---

## Step 1: Generate VAPID Keys

Run this command in any terminal (one time only):

```bash
npx web-push generate-vapid-keys
```

You'll get output like:
```
Public Key: BNj3Qx...abc
Private Key: xYz123...def
```

**Save both keys** - you'll need them in the next steps.

---

## Step 2: Add VAPID Keys to Environment

### Frontend (.env.local)

Add to `d:\DailyDashApp\.env.local`:

```env
VITE_VAPID_PUBLIC_KEY=your_public_key_here
```

### Supabase Secrets

**Option A: Via Supabase Dashboard (Recommended)**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Project Settings** → **Edge Functions** → **Secrets**
3. Add these secrets:

| Secret Name | Value |
|-------------|-------|
| `VAPID_PUBLIC_KEY` | Your public key |
| `VAPID_PRIVATE_KEY` | Your private key |
| `VAPID_SUBJECT` | `mailto:your-email@example.com` |

**Option B: Via Supabase CLI**

```bash
supabase secrets set VAPID_PUBLIC_KEY="your_public_key_here"
supabase secrets set VAPID_PRIVATE_KEY="your_private_key_here"
supabase secrets set VAPID_SUBJECT="mailto:your-email@example.com"
```

---

## Step 3: Run Database Migration

In Supabase SQL Editor, run the contents of:
- `d:\DailyDashApp\migrations\004_push_subscriptions.sql`

This creates the `push_subscriptions` table.

---

## Step 4: Deploy Edge Function

```bash
cd d:\DailyDashApp
supabase functions deploy send-push
```

---

## Step 5: Test

1. Start the dev server: `npm run dev`
2. Log in to DailyDash
3. Allow notifications when prompted
4. Check browser console for: `[Push] Subscribed to push notifications`
5. Check Supabase dashboard → `push_subscriptions` table for your subscription

---

## Sending Test Push (Optional)

Call the Edge Function directly:

```bash
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID", "title": "Test", "body": "Hello from DailyDash!"}'
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No notification prompt | Check browser settings, clear site data, try incognito |
| VAPID key missing | Ensure `VITE_VAPID_PUBLIC_KEY` is in `.env.local` |
| Edge function fails | Check Supabase logs, verify secrets are set |
| Push not received | Ensure browser supports push, check subscription in DB |
