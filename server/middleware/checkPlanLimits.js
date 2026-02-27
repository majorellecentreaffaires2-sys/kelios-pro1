import pool from '../config/db.js';
import { PLANS } from '../config/plans.js';

/**
 * Factory middleware that enforces subscription plan resource limits.
 * @param {'company'|'invoice'|'client'} resourceType
 */
export const checkPlanLimits = (resourceType) => {
    return async (req, res, next) => {
        try {
            if (!req.user?.id) {
                return res.status(401).json({ error: 'Non authentifié' });
            }

            const userId = req.user.id;

            // Fetch fresh user data — never trust JWT for plan/status
            const [userRows] = await pool.query(
                'SELECT role, plan, subscriptionStatus FROM users WHERE id = ?',
                [userId]
            );

            if (!userRows.length) {
                return res.status(404).json({ error: 'Utilisateur non trouvé' });
            }

            const dbUser = userRows[0];
            const status = (dbUser.subscriptionStatus || 'trial').toLowerCase().trim();
            const role = (dbUser.role || 'User').trim();

            console.log(`[PlanCheck] user=${userId} status="${status}" plan="${dbUser.plan}" role="${role}" resource="${resourceType}"`);

            // SuperAdmin bypasses all limits
            if (role === 'SuperAdmin') {
                return next();
            }

            // Map status → planKey: only 'active' users get their paid plan perks
            const planKey = status === 'active' ? (dbUser.plan || 'trial') : 'trial';
            const limits = PLANS[planKey] || PLANS.trial;

            console.log(`[PlanCheck] planKey="${planKey}" limits=${JSON.stringify(limits)}`);

            if (resourceType === 'company') {
                const [[{ count }]] = await pool.query(
                    'SELECT COUNT(*) AS count FROM companies WHERE userId = ?',
                    [userId]
                );

                console.log(`[PlanCheck] companies owned: ${count} / max: ${limits.maxCompanies}`);

                if (count >= limits.maxCompanies) {
                    return res.status(403).json({
                        error: 'LIMIT_REACHED',
                        resource: 'company',
                        message: `Limite de sociétés atteinte (${limits.maxCompanies} max sur votre plan "${limits.label}"). Passez à un plan supérieur pour gérer plus de structures.`,
                        current: count,
                        limit: limits.maxCompanies,
                        plan: planKey
                    });
                }
            }

            if (resourceType === 'invoice') {
                const [compRows] = await pool.query(
                    'SELECT id FROM companies WHERE userId = ?',
                    [userId]
                );
                const companyIds = compRows.map(c => c.id);

                if (companyIds.length === 0) return next();

                const firstDayOfMonth = new Date();
                firstDayOfMonth.setDate(1);
                firstDayOfMonth.setHours(0, 0, 0, 0);

                const [[{ count }]] = await pool.query(
                    'SELECT COUNT(*) AS count FROM invoices WHERE companyId IN (?) AND createdAt >= ?',
                    [companyIds, firstDayOfMonth]
                );

                console.log(`[PlanCheck] invoices this month: ${count} / max: ${limits.maxInvoicesPerMonth}`);

                if (count >= limits.maxInvoicesPerMonth) {
                    return res.status(403).json({
                        error: 'LIMIT_REACHED',
                        resource: 'invoice',
                        message: `Limite de factures mensuelle atteinte (${limits.maxInvoicesPerMonth} max). Passez au plan Pro pour une facturation illimitée.`,
                        current: count,
                        limit: limits.maxInvoicesPerMonth,
                        plan: planKey
                    });
                }
            }

            if (resourceType === 'client') {
                const [compRows] = await pool.query(
                    'SELECT id FROM companies WHERE userId = ?',
                    [userId]
                );
                const companyIds = compRows.map(c => c.id);

                if (companyIds.length === 0) return next();

                const [[{ count }]] = await pool.query(
                    'SELECT COUNT(*) AS count FROM clients WHERE companyId IN (?)',
                    [companyIds]
                );

                console.log(`[PlanCheck] clients total: ${count} / max: ${limits.maxClients}`);

                if (count >= limits.maxClients) {
                    return res.status(403).json({
                        error: 'LIMIT_REACHED',
                        resource: 'client',
                        message: `Limite de clients atteinte (${limits.maxClients} max). Passez à un plan professionnel pour en ajouter davantage.`,
                        current: count,
                        limit: limits.maxClients,
                        plan: planKey
                    });
                }
            }

            next();
        } catch (error) {
            console.error('[PlanCheck] Middleware error:', error);
            res.status(500).json({ error: 'Erreur interne de vérification du plan.' });
        }
    };
};
