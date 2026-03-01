# ClawdSocial Production Setup Checklist

## 1. Inngest Setup (Job Queue)

### Sign up for Inngest
1. Go to https://www.inngest.com
2. Sign up with your email or GitHub
3. Create a new app called "ClawdSocial"

### Get your keys
1. In Inngest dashboard, go to **Apps** → **ClawdSocial**
2. Copy:
   - **Event Key** (starts with `innkey_...`)
   - **Signing Key** (starts with `signkey-...`)

### Add to Vercel
```bash
# In your terminal, or use Vercel dashboard
vercel env add INNGEST_EVENT_KEY
# Paste your event key

vercel env add INNGEST_SIGNING_KEY  
# Paste your signing key
```

Or in Vercel Dashboard:
1. Go to https://vercel.com/dashboard
2. Select your ClawdSocial project
3. Go to **Settings** → **Environment Variables**
4. Add:
   - `INNGEST_EVENT_KEY` = your event key
   - `INNGEST_SIGNING_KEY` = your signing key

### Deploy Inngest functions
Inngest works automatically with Vercel! No separate deploy needed.

Your functions are at: `https://clawdsocial.vercel.app/api/inngest`

---

## 2. X (Twitter) Webhook Setup

### X Developer Portal
1. Go to https://developer.twitter.com/en/portal/dashboard
2. Select your app
3. Go to **Settings** → **Webhooks**

### Add webhook URL
```
https://clawdsocial.vercel.app/api/webhooks/x
```

### Set environment variable
```bash
vercel env add X_WEBHOOK_SECRET
# Create a random secret (32+ characters)
# Example: openssl rand -base64 32
```

---

## 3. Email Notifications (Optional but recommended)

### Option A: Resend (Recommended - Free tier: 3000 emails/month)
1. Sign up at https://resend.com
2. Get API key
3. Add domain (clawdsocial.com or use default)

```bash
vercel env add RESEND_API_KEY
# Paste your Resend API key
```

### Option B: SendGrid
1. Sign up at https://sendgrid.com
2. Get API key
3. Verify sender email

---

## 4. Full Environment Variables Checklist

Make sure these are all set in Vercel:

```
# Database
DATABASE_URL=postgresql://...

# Clerk Auth
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# X OAuth
X_CLIENT_ID=your_client_id
X_CLIENT_SECRET=your_client_secret

# OpenAI
OPENAI_API_KEY=sk-...

# Inngest (NEW)
INNGEST_EVENT_KEY=innkey_...
INNGEST_SIGNING_KEY=signkey-...

# X Webhook (NEW)
X_WEBHOOK_SECRET=your_random_secret

# Email (Optional)
RESEND_API_KEY=re_...

# App URL
NEXT_PUBLIC_APP_URL=https://clawdsocial.vercel.app
```

---

## 5. Test the Setup

### Test Inngest
1. Schedule a post for 1 minute from now
2. Check Inngest dashboard for job runs
3. Verify post publishes automatically

### Test Brand Voice
1. Publish 5+ posts
2. AI will analyze and create voice profile
3. Try "Write for me" in composer - should match your style

### Test Notifications
1. Disconnect X account
2. Try to schedule a post
3. Should receive email notification

---

## 6. Monitoring

### Inngest Dashboard
- View job runs: https://app.inngest.com/functions
- See failures and retries
- Monitor performance

### Vercel Logs
- Check function logs: https://vercel.com/dashboard
- Filter by `/api/inngest`

---

## Quick Commands

```bash
# Check all env vars
vercel env ls

# Add missing vars
vercel env add KEY_NAME

# Redeploy after env changes
vercel --prod
```

---

## Troubleshooting

### Posts not publishing?
- Check Inngest dashboard for failed jobs
- Verify `INNGEST_EVENT_KEY` is correct
- Check Vercel logs for errors

### Brand voice not working?
- Need at least 5 published posts
- Check OpenAI API key has credits
- Voice profile updates monthly

### Emails not sending?
- Check email service dashboard
- Verify sender domain is verified
- Check spam folders

---

## Support

- Inngest Docs: https://www.inngest.com/docs
- X Webhooks: https://developer.twitter.com/en/docs/twitter-api/webhooks
- Resend: https://resend.com/docs
