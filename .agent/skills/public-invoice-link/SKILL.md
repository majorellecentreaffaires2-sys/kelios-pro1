---
name: public-invoice-link
description: Generate a public, shareable link for quotes/invoices that clients can view and accept/decline without logging in.
---

# Skill: Public Invoice + Quote View

## Overview
When a client receives a PDF invoice by email, they can't interact with it digitally. This skill adds public shareable links — clients can view, accept, or decline quotes via a browser link without needing an account.

## Prerequisites
No new packages needed.

## Step 1 — DB Table

Add to `server/config/db.js`:
```js
await connection.query(`
  CREATE TABLE IF NOT EXISTS invoice_tokens (
    id VARCHAR(36) PRIMARY KEY,
    invoiceId VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt DATETIME NULL,
    viewedAt DATETIME NULL,
    respondedAt DATETIME NULL,
    response ENUM('accepted','declined') NULL,
    createdAt DATETIME DEFAULT NOW(),
    INDEX (token),
    INDEX (invoiceId)
  )
`);
```

## Step 2 — Create `server/routes/public.js`

```js
import express from 'express';
import pool from '../config/db.js';
import crypto from 'crypto';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Generate a public link for an invoice (requires auth — only the owner sends this)
router.post('/invoices/:id/public-link', authenticateToken, async (req, res) => {
  try {
    const { expiryDays = 30 } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);
    const id = Math.random().toString(36).substr(2, 9);

    // Delete old token for this invoice
    await pool.query('DELETE FROM invoice_tokens WHERE invoiceId = ?', [req.params.id]);
    await pool.query(
      'INSERT INTO invoice_tokens (id, invoiceId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [id, req.params.id, token, expiresAt]
    );

    const publicUrl = `${process.env.APP_URL || 'http://localhost:5173'}/view/${token}`;
    res.json({ success: true, url: publicUrl, token });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public: view an invoice by token (no auth needed)
router.get('/view/:token', async (req, res) => {
  try {
    const [tokens] = await pool.query(
      'SELECT * FROM invoice_tokens WHERE token = ? AND (expiresAt IS NULL OR expiresAt > NOW())',
      [req.params.token]
    );
    if (tokens.length === 0) return res.status(404).json({ error: 'Lien invalide ou expiré' });

    const tokenRecord = tokens[0];

    // Mark as viewed
    if (!tokenRecord.viewedAt) {
      await pool.query('UPDATE invoice_tokens SET viewedAt = NOW() WHERE id = ?', [tokenRecord.id]);
    }

    // Get invoice
    const [invoices] = await pool.query('SELECT * FROM invoices WHERE id = ?', [tokenRecord.invoiceId]);
    if (invoices.length === 0) return res.status(404).json({ error: 'Facture introuvable' });

    const inv = invoices[0];
    res.json({
      invoice: {
        ...inv,
        sender: JSON.parse(inv.sender || '{}'),
        client: JSON.parse(inv.client || '{}'),
        items: JSON.parse(inv.items || '[]'),
        payments: JSON.parse(inv.payments || '[]'),
      },
      tokenInfo: {
        viewedAt: tokenRecord.viewedAt,
        response: tokenRecord.response,
        respondedAt: tokenRecord.respondedAt
      }
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Public: respond to a quote (accept/decline)
router.post('/view/:token/respond', async (req, res) => {
  const { response } = req.body; // 'accepted' or 'declined'
  if (!['accepted', 'declined'].includes(response)) {
    return res.status(400).json({ error: 'Réponse invalide' });
  }
  try {
    const [tokens] = await pool.query(
      'SELECT * FROM invoice_tokens WHERE token = ? AND (expiresAt IS NULL OR expiresAt > NOW())',
      [req.params.token]
    );
    if (tokens.length === 0) return res.status(404).json({ error: 'Lien invalide ou expiré' });
    if (tokens[0].respondedAt) return res.status(400).json({ error: 'Vous avez déjà répondu' });

    await pool.query(
      'UPDATE invoice_tokens SET response = ?, respondedAt = NOW() WHERE id = ?',
      [response, tokens[0].id]
    );

    // Update invoice status based on response
    const newStatus = response === 'accepted' ? 'Accepte' : 'Refuse';
    await pool.query('UPDATE invoices SET status = ? WHERE id = ?', [newStatus, tokens[0].invoiceId]);

    res.json({ success: true, response });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
```

## Step 3 — Register in `server.js`

```js
import publicRoutes from './server/routes/public.js';
app.use('/api', publicRoutes);
```

## Step 4 — Add to `src/apiClient.ts`

```ts
generatePublicLink: (invoiceId: string, expiryDays?: number) =>
  request<{ url: string; token: string }>(`${API_BASE}/invoices/${invoiceId}/public-link`, 'POST', { expiryDays }),
getPublicInvoice: (token: string) =>
  fetch(`/api/view/${token}`).then(r => r.json()),
respondToPublicInvoice: (token: string, response: 'accepted' | 'declined') =>
  fetch(`/api/view/${token}/respond`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ response }) }).then(r => r.json()),
```

## Step 5 — Create `src/components/PublicInvoiceView.tsx`

This is a standalone page accessible at `/?view=TOKEN` or `/view/TOKEN` (depending on routing setup):

```tsx
import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, Clock, Eye } from 'lucide-react';

const PublicInvoiceView: React.FC<{ token: string }> = ({ token }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [responded, setResponded] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`/api/view/${token}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => { setError('Lien invalide'); setLoading(false); });
  }, [token]);

  const respond = async (response: 'accepted' | 'declined') => {
    const res = await fetch(`/api/view/${token}/respond`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ response })
    }).then(r => r.json());
    if (res.success) setResponded(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-4 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-slate-500">{error}</div>;

  const { invoice, tokenInfo } = data;
  const isQuote = invoice.type === 'Devis' || invoice.type === 'Proforma';
  const alreadyResponded = !!tokenInfo.response;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 font-sans">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-slate-900">{invoice.type} #{invoice.invoiceNumber}</h1>
          <p className="text-slate-500 mt-2">De : <strong>{invoice.sender?.name}</strong></p>
          <p className="text-slate-500">Pour : <strong>{invoice.client?.name}</strong></p>
        </div>

        {/* Invoice summary */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          {(invoice.items || []).map((item: any, i: number) => (
            <div key={i}>
              <p className="font-bold text-slate-800">{item.title}</p>
              {item.subItems?.map((sub: any, j: number) => (
                <div key={j} className="flex justify-between text-sm text-slate-600 py-1 border-b border-slate-50">
                  <span>{sub.description} × {sub.quantity}</span>
                  <span>{(sub.price * sub.quantity).toFixed(2)} {invoice.currency}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Response buttons for quotes */}
        {isQuote && !alreadyResponded && !responded && (
          <div className="flex gap-4">
            <button onClick={() => respond('accepted')}
              className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> Accepter le devis
            </button>
            <button onClick={() => respond('declined')}
              className="flex-1 py-4 bg-red-100 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5" /> Décliner
            </button>
          </div>
        )}

        {(alreadyResponded || responded) && (
          <div className={`p-6 rounded-2xl text-center font-bold ${tokenInfo.response === 'accepted' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {tokenInfo.response === 'accepted' ? '✅ Devis accepté' : '❌ Devis décliné'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicInvoiceView;
```

## Step 6 — Wire into `App.tsx`

In `App.tsx`, check for `?view=TOKEN` in the URL on mount:
```tsx
const viewToken = new URLSearchParams(window.location.search).get('view');
if (viewToken && !isAuthenticated) {
  return <PublicInvoiceView token={viewToken} />;
}
```

## Notes
- Link can be added to the invoice email sent via `sendInvoiceByEmail`
- Tokens expire after configurable days (default 30)
- Only quotes (Devis, Proforma) show accept/decline — invoices show read-only view
