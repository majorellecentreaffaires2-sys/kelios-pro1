# 🚀 Majorlle Pro — SaaS Completion Roadmap

> **Project**: Majorlle Pro — Full-Stack Invoice & ERP SaaS Platform  
> **Stack**: React 19 + TypeScript (Vite) · Node.js/Express · MySQL · Gemini AI · Nodemailer  
> **Last updated**: 2026-02-27  
> **Progress**: `█████████████░░░░░░` 10 / 16 features complete

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
| ✅ 8 | **Plan Limits Enforcement** | `checkPlanLimits.js` · `UpgradePrompt.tsx` | Middleware gates resource creation (Companies, Invoices, Clients) based on plan status. (200dh = 1 company limit, 100dh = +1 extra company) |
| ✅ 9 | **Cron Jobs** | `cronJobs.js` | Automation for recurring invoices, overdue reminders, and trial expiry warnings. |
| ✅ 10 | **In-App Notification Bell** | `NotificationBell.tsx` | MySQL stored notifications, real-time polling, auto-generated from cron & events. |

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
- Update checkout logic to support buying extra companies (+100dh each)
- `.env` needs: `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MONTHLY`, `STRIPE_PRICE_YEARLY`, `STRIPE_PRICE_EXTRA_COMPANY`, `APP_URL`

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

### 🟢 P2 — Polish (Premium Experience)

#### 3. Admin Revenue Dashboard (SuperAdmin)
- MRR, active subscriptions, trial conversions, churn rate
- `server/routes/admin.js` with SQL aggregations
- Visible only to SuperAdmin in the portfolio panel

#### 4. Landing Page / Marketing Site
- Public page at `/` before login
- Features, pricing, FAQ, testimonials
- CTA → Register
- SEO meta tags, Open Graph

#### 5. GDPR Data Export
- Full account export as ZIP (all invoices as PDF + clients CSV + company data)
- Account deletion with cascade (removes all companies, invoices, clients)

#### 6. Responsive PWA (Mobile App Experience)
- Integrate `vite-plugin-pwa` for offline support and "Install" prompt
- Create `manifest.json` (icons, theme color, splash screen)
- Mobile UI audit: Responsive tables, touch-friendly buttons, mobile sidebar
- Service Worker caching for fast load times

---

## 📋 Updated Priority Action Plan

| Status | Priority | Feature | Effort | Impact |
|--------|----------|---------|--------|--------|
| ✅ Done | — | Plan Limits Enforcement | — | — |
| ✅ Done | — | Cron Jobs | — | — |
| ✅ Done | — | Notification Bell | — | — |
| ❌ Next | 🔴 P0 | Real Payment Gateway (Stripe) | 3–5 days | **Launch blocker** |
| ❌ Next | 🔴 P0 | Production Email (Resend) | 4 hours | **Deliverability** |
| ✅ Done | 🟢 P2 | Admin Revenue Dashboard | 1 day | Business insight |
| ✅ Done | 🟢 P3 | Landing Page Conversion | 0.5 days | New Visitors |
| ✅ Done | 🟢 P3 | GDPR Export / Account Deletion | 1 day | Legal |
| ✅ Done | 🟢 P2 | Responsive PWA | 2 days | Mobile users |

---

## 🗂️ Files Still to Create

```
server/
  config/
    stripe.js              # 🔴 Stripe SDK init
  routes/
    payments.js            # 🔴 Stripe sessions + webhooks
    admin.js               # 🟢 SuperAdmin metrics

src/
  components/
    LandingPage.tsx        # 🟢 Marketing landing page
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
STRIPE_PRICE_EXTRA_COMPANY=price_...
APP_URL=https://yourdomain.com

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

# Production email (swap Gmail for Resend)
npm install resend
```

---

*Skills in `.agent/skills/` contain step-by-step implementation for each remaining feature.*
