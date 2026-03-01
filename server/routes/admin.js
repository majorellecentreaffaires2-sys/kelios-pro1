import express from 'express';
import pool from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to ensure user is SuperAdmin
const requireSuperAdmin = async (req, res, next) => {
    try {
        if (!req.user || req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ success: false, message: 'Access denied: SuperAdmin only' });
        }
        next();
    } catch (e) {
        res.status(500).json({ success: false, message: 'Authorization error' });
    }
};

router.get('/metrics', authenticateToken, requireSuperAdmin, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, subscriptionStatus, plan, planInterval, createdAt FROM users');

        let mrr = 0;
        let activeSubscriptions = 0;
        let trials = 0;
        let churned = 0;

        users.forEach(u => {
            if (u.subscriptionStatus === 'active') {
                activeSubscriptions++;

                // Parse plan string like 'monthly_200'
                if (u.plan) {
                    const parts = u.plan.split('_');
                    if (parts.length === 2 && !isNaN(parts[1])) {
                        const amount = parseFloat(parts[1]);
                        if (u.planInterval === 'yearly' || parts[0] === 'yearly') {
                            mrr += amount / 12;
                        } else {
                            mrr += amount;
                        }
                    }
                }
            } else if (u.subscriptionStatus === 'trial') {
                trials++;
            } else if (u.subscriptionStatus === 'canceled' || u.subscriptionStatus === 'expired') {
                churned++;
            }
        });

        let churnRate = 0;
        const total = activeSubscriptions + churned;
        if (total > 0) {
            churnRate = (churned / total) * 100;
        }

        // Get monthly signups for the chart
        const [signups] = await pool.query(`
            SELECT DATE_FORMAT(createdAt, '%Y-%m') as month, COUNT(*) as count 
            FROM users 
            GROUP BY month 
            ORDER BY month ASC 
            LIMIT 12
        `);

        res.json({
            success: true,
            data: {
                mrr: Math.round(mrr),
                activeSubscriptions,
                trials,
                churnRate: churnRate.toFixed(2),
                monthlySignups: signups
            }
        });
    } catch (e) {
        console.error('[Admin Metrics]', e);
        res.status(500).json({ success: false, message: 'Server error parsing metrics' });
    }
});

export default router;
