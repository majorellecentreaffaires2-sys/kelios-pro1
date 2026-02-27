# 🚀 Majorlle Pro — SaaS Completion Roadmap

> **Project**: Majorlle Pro — Full-Stack Invoice & ERP SaaS Platform  
> **Stack**: React 19 + TypeScript (Vite) · Node.js/Express · MySQL · Gemini AI · Nodemailer  
> **Last updated**: 2026-02-26  
> **Progress**: `███████████░░░░░░░░░` 8 / 16 features complete

---

## ✅ DONE — Implemented & Working

| # | Feature | Files | Security |
|---|---|---|---|
| ✅ 1 | **Full user profile via `/api/me`** | `server/routes/users.js` | Returns email, plan, subscription, avatar — password never exposed |
| ✅ 2 | **Password Reset Flow** | `server/routes/auth.js` · `src/components/ForgotPassword.tsx` | SHA-256 hashed tokens, 1hr expiry, one-time use, rate-limited (3/hr), anti-enumeration |
| ✅ 3 | **Public Invoice / Quote Links** | `server/routes/public.js` · `src/components/PublicInvoiceView.tsx` | 80-char crypto token, rate-limited, IP audit log, ownership check, double-response prevention |
| ✅ 4 | **New DB Tables (auto-created)** | `server/config/db.js` | `password_resets`, `invoice_tokens`, `uploads`, `reminder_settings` |
| ✅ 5 | **Users table upgraded** | `server/config/db.js` | Added: `stripeCustomerId`, `stripeSubscriptionId`, `planInterval`, `avatarUrl`, `createdAt` |
| ✅ 6 | **Logo / File Upload** | `server/routes/upload.js` · `src/components/Coordonnees.tsx` | Multer, 5MB limit, production-ready relative paths, CORS/Helmet compatible |
| ✅ 7 | **User Profile / Account Settings** | `src/components/AccountSettings.tsx` | Accessible from Portfolio & Dashboard via TopMenu, profile/password updates |

> 🗄️ **VPS SQL**: See `.agent/VPS_SQL_MIGRATIONS.md` — restart server to auto-apply, or paste SQL manually.

---

## ❌ REMAINING — What Still Needs to Be Built

### 🔴 P0 — Critical (Launch Blockers)

#### 1. Real Payment Gateway (Stripe)
**Status**: `Checkout.tsx` → `api.paySubscription()` just flips a DB flag. **No money is actually charged.**

- Integrate Stripe Subscriptions (`stripe` npm package)
- `server/config/stripe.js` — Stripe SDK init
- `server/routes/payments.js` — checkout session creation + webhooks
- Replace fake `Checkout.tsx` form with redirect to Stripe hosted checkout
- Handle webhooks: `checkout.session.completed`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- `.env` needs: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `APP_URL`

> 📖 Full instructions: `.agent/skills/stripe-payment/SKILL.md`

---

#### 2. Production Email Service
**Status**: Using Gmail SMTP App Password — works locally, **not reliable in production** (blocked by providers, spam risk, no deliverability monitoring).

- Switch to **Resend** (recommended, free tier: 3k/month) or SendGrid / Mailgun
- Use a real domain `From:` address (not Gmail)
- Set up DKIM/SPF records on your domain DNS
- Modify `server/config/email.js` to use Resend SDK

```bash
npm install resend
```

`.env` to add:
```
RESEND_API_KEY=re_xxxxx
```

---

### 🟡 P1 — Important (Core Product Quality)

#### 3. Cron Jobs / Automation Engine
**Status**: ✅ **Implemented**.
- `server/jobs/cronJobs.js` — 4 jobs:
  - Daily 07:00 → Process recurring invoice schedules → auto-create invoices
  - Daily 08:00 → Trial expiry warnings (D-3 and D-1 emails)
  - Daily 09:00 → Overdue invoice reminders (based on `reminder_settings`)
  - Weekly Sun 02:00 → Cleanup expired/used password reset tokens
- Wired into `server.js` with `initCronJobs()`

---


---

#### 6. Subscription Plan Limits Enforcement
**Status**: Once subscribed (active), users have unlimited access. No feature gating by plan.

- Define plan limits (e.g., max 3 companies, max 100 invoices/month on free trial)
- `server/middleware/checkPlanLimits.js` — middleware that checks limits before creating resources
- `src/components/UpgradePrompt.tsx` — modal shown when limit is reached
- Add to: `POST /api/companies`, `POST /api/invoices`, `POST /api/clients`

---

### 🟢 P2 — Polish (Premium Experience)

#### 7. In-App Notification Bell
- `notifications` table in MySQL
- `GET /api/notifications`, `PUT /api/notifications/:id/read`
- Bell icon in TopMenu showing unread count
- Types: invoice overdue, payment received, trial expiry, subscription renewed

#### 8. Admin Revenue Dashboard (SuperAdmin)
- MRR, active subscriptions, trial conversions, churn rate
- `server/routes/admin.js` with SQL aggregations
- Visible only to SuperAdmin in the portfolio panel

#### 9. Landing Page / Marketing Site
- Public page at `/` before login
- Features, pricing, FAQ, testimonials
- CTA → Register
- SEO meta tags, Open Graph

#### 10. GDPR Data Export
- Full account export as ZIP (all invoices as PDF + clients CSV + company data)
- Account deletion with cascade (removes all companies, invoices, clients)

#### 11. Responsive PWA (Mobile App Experience)
- Integrate `vite-plugin-pwa` for offline support and "Install" prompt
- Create `manifest.json` (icons, theme color, splash screen)
- Mobile UI audit: Responsive tables, touch-friendly buttons, mobile sidebar
- Service Worker caching for fast load times

---

## 📋 Updated Priority Action Plan

| Status | Priority | Feature | Effort | Impact |
|--------|----------|---------|--------|--------|
| ✅ Done | — | Fix `/api/me` | — | — |
| ✅ Done | — | Password Reset | — | — |
| ✅ Done | — | Public Invoice / Quote Link | — | — |
| ✅ Done | — | New DB Tables | — | — |
| ✅ Done | — | Users Table Upgraded | — | — |
| ❌ Next | 🔴 P0 | Real Payment Gateway (Stripe) | 3–5 days | **Launch blocker** |
| ❌ Next | 🔴 P0 | Production Email (Resend) | 4 hours | **Deliverability** |
| ✅ Done | — | Logo/File Upload | — | — |
| ✅ Done | — | User Profile / Account Settings | — | — |
| ✅ Done | — | Cron Jobs (recurring, reminders, trial) | — | — |
| ❌ Next | 🟡 P1 | Plan Limits Enforcement | 2 days | Business model |
| ❌ Next | 🟢 P2 | Notification Bell | 1 day | Good UX |
| ❌ Next | 🟢 P2 | Admin Revenue Dashboard | 1 day | Business insight |
| ❌ Next | 🟢 P3 | Landing Page | 2–3 days | Marketing |
| ❌ Next | 🟢 P3 | GDPR Export / Account Deletion | 1 day | Legal |
| ❌ Next | 🟢 P2 | Responsive PWA | 2 days | Mobile users |

---

## 🗂️ Files Still to Create

```
server/
  config/
    stripe.js              # 🔴 Stripe SDK init
  jobs/
    cronJobs.js            # 🟡 node-cron automation engine
  routes/
    payments.js            # 🔴 Stripe sessions + webhooks
    upload.js              # 🟡 multer file upload
    admin.js               # 🟢 SuperAdmin metrics

src/
  components/
    UpgradePrompt.tsx      # 🟡 Plan limit upgrade modal
    NotificationBell.tsx   # 🟢 In-app notifications
    LandingPage.tsx        # 🟢 Marketing landing page

server/middleware/
    checkPlanLimits.js     # 🟡 Route-level plan enforcement
```

---

## 🔧 `.env` Variables Still Needed

```bash
# For Stripe payment
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_MONTHLY=price_...
STRIPE_PRICE_YEARLY=price_...
APP_URL=https://yourdomain.com

# For file uploads
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=5

# For production email (Resend recommended)
RESEND_API_KEY=re_...
```

---

## 📦 NPM Packages Still to Install

```bash
# PWA (Mobile App)
npm install vite-plugin-pwa -D

# Payment (when doing Stripe)
npm install stripe

# File upload (when doing logo upload)
npm install multer

# Automation (when doing cron jobs)
npm install node-cron

# Production email (swap Gmail for Resend)
npm install resend
```

---

*Skills in `.agent/skills/` contain step-by-step implementation for each remaining feature.*
