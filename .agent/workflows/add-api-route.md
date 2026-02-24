---
description: How to add a new API route + frontend connection to the app (standard pattern)
---

# Add a New API Route

This is the standard pattern every new feature follows in Majorlle Pro.

## Step 1 — Create the server route file

```bash
# Example: server/routes/notifications.js
```

```js
import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC LIMIT 50',
      [req.user.id]
    );
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.put('/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?',
      [req.params.id, req.user.id]);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default router;
```

## Step 2 — Register in `server.js`

```js
import notificationRoutes from './server/routes/notifications.js';
app.use('/api/notifications', notificationRoutes);
```

## Step 3 — Add to `src/apiClient.ts`

```ts
getNotifications: () => request<any[]>(`${API_BASE}/notifications`, 'GET'),
markNotificationRead: (id: string) => request<any>(`${API_BASE}/notifications/${id}/read`, 'PUT'),
```

## Step 4 — Create DB table if needed

Add to `server/config/db.js` in the `syncSchema()` function:
```js
await connection.query(`
  CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    userId VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    isRead TINYINT DEFAULT 0,
    link VARCHAR(255) NULL,
    createdAt DATETIME DEFAULT NOW(),
    INDEX (userId)
  )
`);
```

## Step 5 — Restart the server

```bash
# Development
npm run server

# Production
pm2 restart majorlle-pro
```

## Notes
- Always use `authenticateToken` middleware on protected routes
- Always use `req.user.role === 'SuperAdmin'` check for admin-only routes
- Return consistent JSON: `{ success: true, data: [...] }` or `{ error: 'message' }`
- Wrap everything in try/catch
