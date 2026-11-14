# Dompetin

Dompetin is a React + TypeScript personal finance app. Financial records are stored directly in Supabase (PostgreSQL); IndexedDB is no longer used as the primary data store.

## Supabase setup

1. In Supabase Dashboard, open **Authentication → Sign In / Providers** (or Auth settings) and enable **Anonymous Sign-Ins** for this temporary pre-Google-login phase.
2. Run `SUPABASE_SETUP.sql` in the Supabase SQL Editor.
3. Copy the project URL and the **anon / publishable** API key from Supabase Project Settings → API. Never put the `service_role` key in the browser.
4. Add these environment variables in Vercel Project → Settings → Environment Variables, for Production, Preview, and Development:
   - `VITE_SUPABASE_URL` = your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon/publishable key
5. Add the same variables to a local `.env` file when running locally.
6. Install dependencies with `npm install`, then run `npm run build`.
7. Commit and push the changes to GitHub; Vercel will redeploy the existing project.

## Temporary authentication

The app currently creates a Supabase anonymous authenticated user automatically. This allows the existing `authenticated` RLS policies to protect each user's records before Google Login is implemented. Enable anonymous sign-ins in Supabase Auth. When Google Login is added, anonymous accounts should be linked/upgraded to Google identities rather than silently replaced, so the user's existing data remains attached to the same `auth.users.id`.

## Database mapping

- `wallets.initial_balance` stores the opening balance required by the current wallet form.
- `transactions` stores income, expenses, and transfers.
- `budgets.month` stores the first day of the selected month; the UI displays `YYYY-MM`.
- `budgets.alert_threshold` is stored as a whole percentage (80 means 80%).
- `savings_contributions` stores individual deposits; the current amount is calculated from their sum.
- `profiles.id` is the same UUID as `auth.users.id`.

No sample financial records are inserted automatically. New accounts start empty.
