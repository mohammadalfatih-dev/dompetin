-- Dompetin database preparation. Safe to run more than once.
-- Wallet opening balance is used by the existing wallet UI.
ALTER TABLE public.wallets
  ADD COLUMN IF NOT EXISTS initial_balance numeric NOT NULL DEFAULT 0;

-- A profile ID must be the same UUID as auth.users.id.
ALTER TABLE public.profiles
  ALTER COLUMN id DROP DEFAULT;

-- New savings contributions should use the actual current date.
ALTER TABLE public.savings_contributions
  ALTER COLUMN contribution_date SET DEFAULT CURRENT_DATE;

-- Keep boolean defaults explicit for newly created rows.
ALTER TABLE public.wallets
  ALTER COLUMN is_archived SET DEFAULT false;
ALTER TABLE public.categories
  ALTER COLUMN is_system SET DEFAULT false;
