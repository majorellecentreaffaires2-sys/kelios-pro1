---
name: password-reset
description: Implement forgot password and password reset flow using email-based token validation.
---

# Skill: Password Reset Flow

## Overview
Currently there is NO way for users to recover their account if they forget their password. This skill adds the complete forgot-password → reset flow.

## Prerequisites
- Email (SMTP) is already configured in `.env`
- No new npm packages needed

## Step 1 — Add DB Table

Run in MySQL:
```sql
CREATE TABLE IF NOT EXISTS password_resets (
  id VARCHAR(36) PRIMARY KEY,
  userId VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expiresAt DATETIME NOT NULL,
  usedAt DATETIME NULL,
  createdAt DATETIME DEFAULT NOW(),
  INDEX (token),
  INDEX (userId)
);
```

Or add to `server/config/db.js` `syncSchema()` function:
```js
await connection.query(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expiresAt DATETIME NOT NULL,
    usedAt DATETIME NULL,
    createdAt DATETIME DEFAULT NOW()
  )
`);
```

## Step 2 — Add routes to `server/routes/auth.js`

Add these two routes to the existing auth router:

```js
import crypto from 'crypto';

// FORGOT PASSWORD — sends reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email requis' });

  try {
    const [rows] = await pool.query('SELECT id, username FROM users WHERE email = ?', [email]);
    // Always return success to avoid email enumeration attacks
    if (rows.length === 0) return res.json({ success: true, message: 'Si cet email existe, un lien vous sera envoyé.' });

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    const id = Math.random().toString(36).substr(2, 9);

    // Invalidate old tokens for this user
    await pool.query('DELETE FROM password_resets WHERE userId = ?', [user.id]);
    await pool.query('INSERT INTO password_resets (id, userId, token, expiresAt) VALUES (?, ?, ?, ?)',
      [id, user.id, token, expiresAt]);

    const resetUrl = `${process.env.APP_URL || 'http://localhost:5173'}?reset=${token}`;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Majorlle Pro" <noreply@majorlle.pro>',
      to: email,
      subject: 'Réinitialisation de votre mot de passe - Majorlle Pro',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #f1f5f9; border-radius: 20px;">
          <h2 style="color: #2563eb;">Réinitialisation du mot de passe</h2>
          <p>Bonjour <strong>${user.username}</strong>,</p>
          <p>Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le lien ci-dessous :</p>
          <a href="${resetUrl}" style="display:inline-block; background:#2563eb; color:white; padding:14px 28px; border-radius:12px; text-decoration:none; font-weight:bold; margin:20px 0;">
            Réinitialiser mon mot de passe
          </a>
          <p style="color:#94a3b8; font-size:13px;">Ce lien expire dans 1 heure. Si vous n'avez pas fait cette demande, ignorez cet email.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Si cet email existe, un lien vous sera envoyé.' });
  } catch (e) {
    console.error('Forgot password error:', e);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// RESET PASSWORD — validates token and updates password
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ success: false, message: 'Données manquantes' });
  if (password.length < 6) return res.status(400).json({ success: false, message: 'Le mot de passe doit contenir au moins 6 caractères' });

  try {
    const [rows] = await pool.query(
      'SELECT * FROM password_resets WHERE token = ? AND expiresAt > NOW() AND usedAt IS NULL',
      [token]
    );
    if (rows.length === 0) return res.status(400).json({ success: false, message: 'Lien invalide ou expiré' });

    const reset = rows[0];
    const hashedPassword = await bcrypt.hash(password, 12);

    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, reset.userId]);
    await pool.query('UPDATE password_resets SET usedAt = NOW() WHERE id = ?', [reset.id]);

    res.json({ success: true, message: 'Mot de passe mis à jour avec succès' });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
```

## Step 3 — Update `src/apiClient.ts`

```ts
forgotPassword: (email: string) =>
  request<any>(`${API_BASE}/forgot-password`, 'POST', { email }),
resetPassword: (token: string, password: string) =>
  request<any>(`${API_BASE}/reset-password`, 'POST', { token, password }),
```

## Step 4 — Create `src/components/ForgotPassword.tsx`

```tsx
import React, { useState } from 'react';
import { api } from '../apiClient';
import { Mail, ArrowLeft, CheckCircle2, Lock } from 'lucide-react';

interface ForgotPasswordProps {
  onBack: () => void;
  resetToken?: string; // If present, show the reset form
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, resetToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.forgotPassword(email);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError('Les mots de passe ne correspondent pas');
    setLoading(true);
    setError('');
    try {
      await api.resetPassword(resetToken!, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  if (done && !resetToken) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-900">Email envoyé !</h3>
        <p className="text-slate-500">Vérifiez votre boîte mail et cliquez sur le lien de réinitialisation.</p>
        <button onClick={onBack} className="text-blue-600 font-bold text-sm underline">Retour à la connexion</button>
      </div>
    );
  }

  if (done && resetToken) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
        <h3 className="text-xl font-extrabold text-slate-900">Mot de passe mis à jour !</h3>
        <button onClick={onBack} className="text-blue-600 font-bold text-sm underline">Se connecter</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 text-sm font-bold hover:text-slate-800">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      <div>
        <h3 className="text-2xl font-extrabold text-slate-900">
          {resetToken ? 'Nouveau mot de passe' : 'Mot de passe oublié'}
        </h3>
        <p className="text-slate-500 mt-1 text-sm">
          {resetToken ? 'Choisissez un nouveau mot de passe sécurisé.' : 'Entrez votre email pour recevoir un lien de réinitialisation.'}
        </p>
      </div>
      {error && <p className="text-red-500 text-sm bg-red-50 px-4 py-3 rounded-xl">{error}</p>}
      <form onSubmit={resetToken ? handleReset : handleForgot} className="space-y-4">
        {!resetToken ? (
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-5 font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
              placeholder="votre@email.com" />
          </div>
        ) : (
          <>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-5 font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                placeholder="Nouveau mot de passe" />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input type="password" required value={confirm} onChange={e => setConfirm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-12 pr-5 font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-50"
                placeholder="Confirmer le mot de passe" />
            </div>
          </>
        )}
        <button type="submit" disabled={loading}
          className="w-full py-4 bg-blue-600 text-white rounded-2xl font-extrabold text-sm uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all disabled:opacity-50">
          {loading ? 'Envoi...' : resetToken ? 'Réinitialiser' : 'Envoyer le lien'}
        </button>
      </form>
    </div>
  );
};

export default ForgotPassword;
```

## Step 5 — Wire into `Login.tsx`

In `Login.tsx`, add a "Mot de passe oublié?" link that shows the `ForgotPassword` component.

Also, in `App.tsx`, check the URL for a `?reset=TOKEN` param on mount and show the reset form:
```tsx
const resetToken = new URLSearchParams(window.location.search).get('reset');
if (resetToken && !isAuthenticated) {
  // Show ForgotPassword with resetToken prop
}
```

## Notes
- Tokens expire after 1 hour — secure by design
- Always return the same message whether the email exists or not (prevents enumeration)
- Clean up used + expired tokens with a daily cron job
