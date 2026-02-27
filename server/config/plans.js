/**
 * Subscription plan definitions.
 * Keys must match what is stored in users.plan column in the DB.
 * 'trial' is the fallback used when users.subscriptionStatus !== 'active'.
 */
export const PLANS = {
    trial: {
        label: 'Free Trial',
        maxCompanies: 1,
        maxInvoicesPerMonth: 5,
        maxClients: 10,
    },
    monthly_200: {
        label: 'Pro Mensuel',
        maxCompanies: 5,
        maxInvoicesPerMonth: 500,
        maxClients: 1000,
    },
    yearly_2000: {
        label: 'Pro Annuel',
        maxCompanies: 15,
        maxInvoicesPerMonth: 5000,
        maxClients: 5000,
    },
};
