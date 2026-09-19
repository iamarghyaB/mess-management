// src/lib/supabase.ts

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Table name constants
export const TABLES = {
  // New tables
  MEMBERS: 'members',
  MONTHS: 'months',
  MEALS: 'meals',
  BAZARS: 'bazars',
  BAZAR_ITEMS: 'bazar_items',
  BAZAR_AUDIT: 'bazar_audit',
  BAZAR_CORRECTION_REQUESTS: 'bazar_correction_requests',
  PAYMENTS: 'payments',
  OTHER_COSTS: 'other_costs',
  // Legacy tables (preserved, not used in new UI)
  EXPENSES: 'expenses',
  CONTRIBUTIONS: 'contributions',
  MARKET_DUTY: 'market_duty',
} as const;

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export function formatMonthYear(month: number, year: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function formatCurrency(amount: number): string {
  return `৳${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
