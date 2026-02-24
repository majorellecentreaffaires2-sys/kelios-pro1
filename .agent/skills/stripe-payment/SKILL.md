---
name: stripe-payment
description: Integrate real Stripe payment processing to replace the simulated checkout. Handles subscription creation, webhooks, and subscription status sync.
---

# Skill: Stripe Payment Integration

## Overview
The app currently has a fake checkout (`Checkout.tsx`) that just calls `api.paySubscription()` which flips a DB flag. This skill replaces it with real Stripe Subscriptions.

## Prerequisites
- Run: `npm install stripe @stripe/stripe-js @stripe/react-stripe-js`
- Create a Stripe account at https://stripe.com
- Create two Prices in Stripe Dashboard: one monthly (200 MAD), one yearly (2000 MAD)
- Add to `.env`:
  ```
  STRIPE_SECRET_KEY=sk_live_xxx
  STRIPE_PUBLISHABLE_KEY=pk_live_xxx
  STRIPE_WEBHOOK_SECRET=whsec_xxx
  STRIPE_PRICE_MONTHLY=price_xxx
  STRIPE_PRICE_YEARLY=price_xxx
  ```

## Step 1 — Create `server/config/stripe.js`

```js
import Stripe from 'stripe';
import 'dotenv/config';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
});

export default stripe;
```

## Step 2 — Create `server/routes/payments.js`

This file handles:
- `POST /api/payments/create-checkout-session` → creates a Stripe Checkout session
- `POST /api/payments/webhook` → receives Stripe events (payment success, cancellation)
- `GET /api/payments/portal` → redirect to Stripe Customer Portal for self-serve billing

```js
import express from 'express';
import stripe from '../config/stripe.js';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import 'dotenv/config';

const router = express.Router();

// Create Stripe Checkout Session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  const { plan } = req.body; // 'monthly' or 'yearly'
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    const user = rows[0];

    // Ensure Stripe customer exists
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: { userId: user.id }
      });
      customerId = customer.id;
      await pool.query('UPDATE users SET stripeCustomerId = ? WHERE id = ?', [customerId, user.id]);
    }

    const priceId = plan === 'yearly'
      ? process.env.STRIPE_PRICE_YEARLY
      : process.env.STRIPE_PRICE_MONTHLY;

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${process.env.APP_URL}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/checkout-cancel`,
      metadata: { userId: user.id, plan }
    });

    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Stripe Webhook (MUST use raw body parser — set up in server.js)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    return res.status(400).send(`Webhook Error: ${e.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata.userId;
        const subscriptionId = session.subscription;
        await pool.query(
          'UPDATE users SET subscriptionStatus = "active", stripeSubscriptionId = ?, lastPaymentDate = NOW() WHERE id = ?',
          [subscriptionId, userId]
        );
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        const customerId = invoice.customer;
        await pool.query(
          'UPDATE users SET subscriptionStatus = "active", lastPaymentDate = NOW() WHERE stripeCustomerId = ?',
          [customerId]
        );
        break;
      }
      case 'invoice.payment_failed':
      case 'customer.subscription.deleted': {
        const obj = event.data.object;
        const customerId = obj.customer;
        await pool.query(
          'UPDATE users SET subscriptionStatus = "locked" WHERE stripeCustomerId = ?',
          [customerId]
        );
        break;
      }
    }
    res.json({ received: true });
  } catch (e) {
    console.error('Webhook handler error:', e);
    res.status(500).json({ error: e.message });
  }
});

// Customer Portal (self-serve billing management)
router.post('/portal', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT stripeCustomerId FROM users WHERE id = ?', [req.user.id]);
    const customerId = rows[0]?.stripeCustomerId;
    if (!customerId) return res.status(400).json({ error: 'No Stripe customer found' });

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.APP_URL}/app`
    });
    res.json({ url: session.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

## Step 3 — Update `server.js`

Add the payments route. **IMPORTANT**: The webhook endpoint needs raw body, so register it BEFORE `bodyParser.json()`:

```js
import paymentRoutes from './server/routes/payments.js';

// BEFORE bodyParser.json() middleware:
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// After other routes:
app.use('/api/payments', paymentRoutes);
```

## Step 4 — Update `src/components/Checkout.tsx`

Replace the fake card form with a simple redirect to Stripe Checkout:

```tsx
const handlePayment = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await api.createCheckoutSession(plan);
    window.location.href = res.url; // Redirect to Stripe hosted checkout
  } catch (e) {
    alert('Erreur lors de la création de la session de paiement.');
  } finally {
    setLoading(false);
  }
};
```

## Step 5 — Add to `src/apiClient.ts`

```ts
createCheckoutSession: (plan: 'monthly' | 'yearly') =>
  request<{ url: string }>(`${API_BASE}/payments/create-checkout-session`, 'POST', { plan }),
openBillingPortal: () =>
  request<{ url: string }>(`${API_BASE}/payments/portal`, 'POST'),
```

## Step 6 — DB Migration

```sql
ALTER TABLE users
  ADD COLUMN stripeCustomerId VARCHAR(255) NULL,
  ADD COLUMN stripeSubscriptionId VARCHAR(255) NULL,
  ADD COLUMN planInterval ENUM('monthly','yearly') DEFAULT 'monthly',
  ADD COLUMN lastPaymentDate DATETIME NULL;
```

## Step 7 — Test with Stripe CLI

```bash
# Install Stripe CLI, then:
stripe listen --forward-to localhost:5000/api/payments/webhook

# Use test card: 4242 4242 4242 4242, any future date, any CVC
```

## Stripe Prices Setup (Dashboard)
1. Go to Stripe Dashboard → Products → Add Product → "Majorlle Pro"
2. Add price: 200 MAD / month (recurring)
3. Add price: 2000 MAD / year (recurring)
4. Copy the `price_xxx` IDs into `.env`

## Notes
- For Morocco (MAD currency), Stripe requires business verification
- Alternative: use **CMI** (Centre Monétique Interbancaire) for local card payments
- Always test with Stripe test keys before going live
