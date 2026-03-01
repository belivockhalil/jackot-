-- ─────────────────────────────────────────────────────
-- JACKOT — Database Tables
-- Run this in Supabase SQL Editor to create all tables
-- ─────────────────────────────────────────────────────


-- ── 1. SETTINGS (per business config) ────────────────
CREATE TABLE settings (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Business identity
  business_name     text    DEFAULT 'My Business',
  business_logo     text,
  business_phone    text,
  business_email    text,
  business_address  text,

  -- Financial preferences
  currency          text    DEFAULT 'KES',
  currency_symbol   text    DEFAULT 'KSh',
  tax_rate          numeric DEFAULT 0.16,
  tax_label         text    DEFAULT 'VAT',
  fiscal_year_start text    DEFAULT '01-01',

  -- Display preferences
  language          text    DEFAULT 'en',
  date_format       text    DEFAULT 'DD/MM/YYYY',
  timezone          text    DEFAULT 'Africa/Nairobi',
  number_format     text    DEFAULT 'comma',

  -- Theme
  theme_primary     text    DEFAULT '#1D4ED8',
  theme_accent      text    DEFAULT '#0EA5E9',
  theme_background  text    DEFAULT '#F8FAFC',
  invoice_color     text    DEFAULT '#1D4ED8',
  dark_mode         boolean DEFAULT false,

  -- Dashboard
  dashboard_layout  text    DEFAULT 'standard',
  greeting_name     text,

  -- Invoice
  invoice_prefix    text    DEFAULT 'INV',
  invoice_notes     text    DEFAULT 'Thank you for your business!',
  invoice_footer    text,

  created_at        timestamptz DEFAULT now(),
  updated_at        timestamptz DEFAULT now()
);


-- ── 2. MODULES (master list of all features) ─────────
CREATE TABLE modules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  module_key   text UNIQUE NOT NULL,
  name         text NOT NULL,
  description  text,
  category     text,
  icon         text,
  requires     text[],
  sort_order   int  DEFAULT 0,
  is_active    boolean DEFAULT true
);


-- ── 3. USER MODULES (which modules each business has ON/OFF) ──
CREATE TABLE user_modules (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  module_key   text REFERENCES modules(module_key),
  is_enabled   boolean DEFAULT true,
  updated_at   timestamptz DEFAULT now(),
  UNIQUE(user_id, module_key)
);


-- ── 4. EXPENSE CATEGORIES ─────────────────────────────
CREATE TABLE expense_categories (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name         text NOT NULL,
  icon         text,
  color        text,
  type         text DEFAULT 'general',
  is_visible   boolean DEFAULT true,
  sort_order   int  DEFAULT 0,
  created_at   timestamptz DEFAULT now()
);


-- ── 5. INCOME SOURCES ────────────────────────────────
CREATE TABLE income_sources (
  id                 uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name               text NOT NULL,
  icon               text,
  is_project_linked  boolean DEFAULT false,
  is_visible         boolean DEFAULT true,
  sort_order         int DEFAULT 0,
  created_at         timestamptz DEFAULT now()
);


-- ── 6. CLIENTS ───────────────────────────────────────
CREATE TABLE clients (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  phone            text,
  email            text,
  location         text,
  notes            text,
  is_regular       boolean DEFAULT false,
  total_billed     numeric DEFAULT 0,
  total_paid       numeric DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);


-- ── 7. SUPPLIERS ─────────────────────────────────────
CREATE TABLE suppliers (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name             text NOT NULL,
  phone            text,
  email            text,
  items_supplied   text,
  notes            text,
  total_owed       numeric DEFAULT 0,
  total_paid       numeric DEFAULT 0,
  created_at       timestamptz DEFAULT now(),
  updated_at       timestamptz DEFAULT now()
);


-- ── 8. PROJECTS ──────────────────────────────────────
CREATE TABLE projects (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id             uuid REFERENCES clients(id),
  name                  text NOT NULL,
  product_type          text,
  status                text DEFAULT 'active',
  contract_amount       numeric DEFAULT 0,
  estimated_completion  date,
  actual_completion     date,
  sketch_url            text,
  notes                 text[],
  completion_photos     text[],
  created_at            timestamptz DEFAULT now(),
  updated_at            timestamptz DEFAULT now()
);


-- ── 9. INCOME ENTRIES ────────────────────────────────
CREATE TABLE income_entries (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date              date NOT NULL,
  source_id         uuid REFERENCES income_sources(id),
  project_id        uuid REFERENCES projects(id),
  client_id         uuid REFERENCES clients(id),
  amount            numeric NOT NULL,
  collection_point  text,
  reference_code    text,
  notes             text,
  created_at        timestamptz DEFAULT now()
);


-- ── 10. EXPENSE ENTRIES ──────────────────────────────
CREATE TABLE expense_entries (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date              date NOT NULL,
  category_id       uuid REFERENCES expense_categories(id),
  project_id        uuid REFERENCES projects(id),
  supplier_id       uuid REFERENCES suppliers(id),
  amount            numeric NOT NULL,
  type              text DEFAULT 'general',
  collection_point  text,
  reference_code    text,
  notes             text,
  created_at        timestamptz DEFAULT now()
);


-- ── 11. BANK LEDGER ──────────────────────────────────
CREATE TABLE bank_ledger (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ledger_type       text NOT NULL,
  date              date NOT NULL,
  description       text,
  amount_in         numeric DEFAULT 0,
  amount_out        numeric DEFAULT 0,
  balance           numeric DEFAULT 0,
  linked_type       text,
  linked_id         uuid,
  reference_code    text,
  created_at        timestamptz DEFAULT now()
);


-- ── 12. LOANS ────────────────────────────────────────
CREATE TABLE loans (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  type             text DEFAULT 'short_term',
  lender           text,
  principal        numeric DEFAULT 0,
  interest_rate    numeric DEFAULT 0,
  start_date       date,
  end_date         date,
  total_repaid     numeric DEFAULT 0,
  notes            text,
  created_at       timestamptz DEFAULT now()
);


-- ── 13. SAVINGS ──────────────────────────────────────
CREATE TABLE savings (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date             date NOT NULL,
  amount           numeric NOT NULL,
  direction        text DEFAULT 'deposit',
  balance          numeric DEFAULT 0,
  notes            text,
  created_at       timestamptz DEFAULT now()
);


-- ── 14. ASSETS ───────────────────────────────────────
CREATE TABLE assets (
  id                uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name              text NOT NULL,
  category          text,
  purchase_date     date,
  purchase_price    numeric DEFAULT 0,
  current_value     numeric DEFAULT 0,
  depreciation_rate numeric DEFAULT 0,
  notes             text,
  created_at        timestamptz DEFAULT now()
);


-- ── 15. BUSINESS GOALS ───────────────────────────────
CREATE TABLE business_goals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  description      text NOT NULL,
  target_value     numeric DEFAULT 0,
  current_value    numeric DEFAULT 0,
  target_date      date,
  unit             text DEFAULT 'customers',
  created_at       timestamptz DEFAULT now()
);


-- ── 16. NOTEBOOK ─────────────────────────────────────
CREATE TABLE notebook (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  date             timestamptz DEFAULT now(),
  type             text DEFAULT 'general',
  project_id       uuid REFERENCES projects(id),
  content          text,
  tags             text[],
  created_at       timestamptz DEFAULT now()
);