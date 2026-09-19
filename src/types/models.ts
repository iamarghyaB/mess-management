// src/types/models.ts

// ─── Auth & Members ───────────────────────────────────────────────
export interface Member {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  joining_date: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

// ─── Months ───────────────────────────────────────────────────────
export interface Month {
  id: string;
  month: number;
  year: number;
  manager_id: string | null;
  status: 'active' | 'closed';
  created_at: string;
  closed_at: string | null;
  // Joined
  manager?: Member;
}

// ─── Meals ────────────────────────────────────────────────────────
export interface Meal {
  id: string;
  date: string;
  member_id: string;
  month_id: string;
  breakfast: 0 | 1;
  lunch: 0 | 1;
  dinner: 0 | 1;
  total_meal: number;
  created_at: string;
  updated_at: string;
  // Joined
  member?: Member;
}

// ─── Bazar ────────────────────────────────────────────────────────
export interface BazarItem {
  id: string;
  bazar_id: string;
  item_name: string;
  quantity: number;
  price: number;
  created_at: string;
}

export interface Bazar {
  id: string;
  date: string;
  month_id: string;
  purchased_by: string;
  total_amount: number;
  note: string | null;
  status: 'active' | 'correcting';
  created_at: string;
  updated_at: string;
  // Joined
  purchaser?: Member;
  items?: BazarItem[];
}

// ─── Bazar Audit ─────────────────────────────────────────────────
export interface BazarAudit {
  id: string;
  bazar_id: string;
  action: string;
  performed_by: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  note: string | null;
  timestamp: string;
  // Joined
  performer?: Member;
}

// ─── Correction Requests ─────────────────────────────────────────
export interface CorrectionRequest {
  id: string;
  bazar_id: string;
  requested_by: string;
  month_id: string;
  old_amount: number;
  requested_amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  edit_granted_at: string | null;
  edit_used_at: string | null;
  created_at: string;
  // Joined
  requester?: Member;
  bazar?: Bazar;
}

// ─── Payments ────────────────────────────────────────────────────
export interface Payment {
  id: string;
  member_id: string;
  month_id: string;
  amount: number;
  date: string;
  payment_method: 'cash' | 'bkash' | 'nagad' | 'bank' | 'other';
  note: string | null;
  status: 'pending' | 'confirmed' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  member?: Member;
}

// ─── Other Costs ─────────────────────────────────────────────────
export interface OtherCost {
  id: string;
  month_id: string;
  description: string;
  amount: number;
  added_by: string | null;
  date: string;
  created_at: string;
}

// ─── Balance Calculation ─────────────────────────────────────────
export interface MemberBalance {
  member: Member;
  totalMeals: number;
  mealCost: number;
  otherCostShare: number;
  totalPayable: number;
  totalPaid: number;
  balance: number; // positive = member receives, negative = member owes
}

export interface MonthSummary {
  month: Month;
  totalMembers: number;
  totalMeals: number;
  foodExpense: number;
  otherExpense: number;
  totalExpense: number;
  mealRate: number;
  totalCollected: number;
  totalDue: number;
  memberBalances: MemberBalance[];
}

// ─── Context Types ───────────────────────────────────────────────
export interface AuthContextType {
  user: import('@supabase/supabase-js').User | null;
  member: Member | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export interface MonthContextType {
  activeMonth: Month | null;
  allMonths: Month[];
  isCurrentManager: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
}