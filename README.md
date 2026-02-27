# ClawdSocial

**The AI-Native Social Media Management Platform**

Built for creators, agencies, and autonomous agents. Schedule, publish, and analyze across all major platforms from one beautiful dashboard.

## Vision

ClawdSocial is the first SaaS product from ClawdCorp — a social media management platform that bridges human creativity with AI automation. While our internal Shinra Mission Control powers agentic workflows, ClawdSocial brings that power to everyone.

## Differentiation

| Feature | VistaSocial | Buffer | Hootsuite | **ClawdSocial** |
|---------|-------------|--------|-----------|-----------------|
| Visual Calendar | ✅ | ✅ | ✅ | ✅ |
| AI Content Gen | ✅ | ✅ | ✅ | ✅ |
| **Agentic Workflows** | ❌ | ❌ | ❌ | ✅ |
| **Approval-First** | Partial | ❌ | ✅ | ✅ |
| **Shinra Integration** | ❌ | ❌ | ❌ | ✅ |
| Autonomous Posting | ❌ | ❌ | ❌ | ✅ |

## Tech Stack

- **Next.js 15** — App Router, React Server Components
- **Tailwind CSS** — Utility-first styling
- **shadcn/ui** — Production-ready components
- **Prisma + PostgreSQL** — Database (Neon)
- **Clerk** — Authentication
- **Stripe** — Payments
- **Vercel** — Deployment

## Core Features (MVP)

### 1. Visual Content Calendar
- Monthly/weekly views
- Drag-to-reschedule
- Color-coded by platform/status
- Bulk actions

### 2. Multi-Platform Publishing
- X (Twitter)
- Instagram
- LinkedIn
- TikTok
- YouTube Shorts

### 3. AI Content Studio
- Caption generation
- Thread builder
- Image suggestions
- Tone matching

### 4. Analytics Dashboard
- Follower growth
- Engagement rates
- Best time to post
- Competitor tracking

### 5. Team Collaboration
- Roles (Admin, Editor, Viewer)
- Approval workflows
- Comments on drafts
- Activity log

## Pricing

| Plan | Price | Features |
|------|-------|----------|
| **Free** | $0 | 1 account, 10 posts/month |
| **Pro** | $29/mo | 5 accounts, unlimited posts, AI, analytics |
| **Agency** | $99/mo | 25 accounts, team features, white-label |
| **Enterprise** | Custom | API access, SLA, dedicated support |

## Development Roadmap

### Phase 1: Core (Weeks 1-2)
- [ ] Project setup (Next.js, Tailwind, shadcn)
- [ ] Database schema
- [ ] Auth (Clerk)
- [ ] X integration
- [ ] Visual calendar
- [ ] Basic composer

### Phase 2: Polish (Weeks 3-4)
- [ ] AI content generation
- [ ] Analytics dashboard
- [ ] Team features
- [ ] Mobile responsive
- [ ] Stripe payments

### Phase 3: Scale (Weeks 5-6)
- [ ] Additional platforms
- [ ] Content library
- [ ] Engagement inbox
- [ ] API for developers
- [ ] Shinra agent integration

## Local Development

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Add your keys (Clerk, Stripe, Neon, X API)

# Initialize database
npx prisma db push
npx prisma generate

# Run dev server
npm run dev
```

## Environment Variables

```bash
# Database
DATABASE_URL="postgresql://..."

# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."

# Payments (Stripe)
STRIPE_PUBLISHABLE_KEY="pk_..."
STRIPE_SECRET_KEY="sk_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# X API
X_API_KEY="..."
X_API_SECRET="..."

# OpenAI (for AI features)
OPENAI_API_KEY="sk-..."
```

## Deployment

```bash
# Deploy to Vercel
vercel --prod
```

## License

MIT © ClawdCorp

---

*Built with ❤️ by the ClawdCorp team*
