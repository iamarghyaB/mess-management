// src/pages/Dashboard.tsx

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Utensils,
  ShoppingBag,
  CreditCard,
  Calculator,
  ArrowUpRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useMonthContext } from '../contexts/MonthContext';
import { useBalance } from '../hooks/useBalance';
import { useMeals } from '../hooks/useMeals';
import { useCorrectionRequests } from '../hooks/useCorrectionRequests';
import { usePayments } from '../hooks/usePayments';
import { StatCard } from '../components/StatCard';
import { formatCurrency, formatMonthYear } from '../lib/supabase';

export default function Dashboard() {
  const navigate = useNavigate();
  const { member } = useAuthContext();
  const { activeMonth, isCurrentManager } = useMonthContext();
  const { summary, loading: balanceLoading } = useBalance();
  const { meals } = useMeals();
  const { pendingRequests } = useCorrectionRequests();
  const { pendingPayments } = usePayments();

  if (!activeMonth) {
    return (
      <div className="card text-center py-12">
        <Clock size={48} className="text-muted mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">No Active Month Found</h2>
        <p className="text-secondary max-w-md mx-auto mb-6">
          There is currently no active month setup. If you are a manager, please create a new month to start tracking.
        </p>
        <button
          onClick={() => navigate('/month-management')}
          className="btn btn-primary btn-lg mx-auto"
        >
          <PlusCircle size={18} /> Manage Months
        </button>
      </div>
    );
  }

  // Find logged in member's balance
  const myBalance = summary?.memberBalances.find(b => b.member.id === member?.id);
  // Find logged in member's meal today
  const todayStr = new Date().toISOString().split('T')[0];
  const myTodayMeal = meals.find(m => m.member_id === member?.id && m.date === todayStr);

  return (
    <div>
      {/* Header Banner */}
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {formatMonthYear(activeMonth.month, activeMonth.year)} Dashboard
          </h1>
          <p className="section-subtitle flex items-center gap-2">
            <span>Role:</span>
            <span className={`badge ${isCurrentManager ? 'badge-manager' : 'badge-member'}`}>
              {isCurrentManager ? 'Current Month Manager' : 'Member'}
            </span>
          </p>
        </div>

        <div className="flex gap-2">
          <button onClick={() => navigate('/meals')} className="btn btn-primary">
            <Utensils size={16} /> My Meal Today
          </button>
          <button onClick={() => navigate('/bazar')} className="btn btn-ghost">
            <ShoppingBag size={16} /> Add Bazar
          </button>
        </div>
      </div>

      {/* Current Month Overview Stats */}
      <div className="stat-grid mb-6">
        <StatCard
          title="Total Members"
          value={summary?.totalMembers ?? 0}
          subtitle="Active mess members"
          icon={Users}
          variant="blue"
        />
        <StatCard
          title="Total Meals"
          value={summary?.totalMeals ?? 0}
          subtitle="Consumed this month"
          icon={Utensils}
          variant="green"
        />
        <StatCard
          title="Food Expense"
          value={formatCurrency(summary?.foodExpense ?? 0)}
          subtitle="Total Bazar costs"
          icon={ShoppingBag}
          variant="amber"
        />
        <StatCard
          title="Meal Rate"
          value={summary?.mealRate ? formatCurrency(summary.mealRate) : '৳0.00'}
          subtitle="Expense / Total Meals"
          icon={Calculator}
          variant="purple"
        />
        <StatCard
          title="Total Collected"
          value={formatCurrency(summary?.totalCollected ?? 0)}
          subtitle="Confirmed member payments"
          icon={CreditCard}
          variant="teal"
        />
        <StatCard
          title="Total Due"
          value={formatCurrency(summary?.totalDue ?? 0)}
          subtitle="Pending collections"
          icon={AlertCircle}
          variant="red"
        />
      </div>

      {/* Role Specific Alert Panels for Manager */}
      {isCurrentManager && (
        <div className="grid grid-2 mb-6">
          {/* Pending Correction Requests */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2 text-amber">
                <AlertCircle size={16} /> Pending Correction Requests ({pendingRequests.length})
              </h3>
              <button
                onClick={() => navigate('/bazar')}
                className="btn btn-ghost btn-sm"
              >
                Review All <ArrowUpRight size={14} />
              </button>
            </div>
            {pendingRequests.length === 0 ? (
              <p className="text-muted text-sm py-2">No pending bazar correction requests.</p>
            ) : (
              <div className="space-y-2">
                {pendingRequests.slice(0, 3).map(req => (
                  <div key={req.id} className="p-3 bg-input rounded flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold">{req.requester?.name}</div>
                      <div className="text-xs text-muted">Reason: {req.reason}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-red font-semibold">Old: {formatCurrency(req.old_amount)}</div>
                      <div className="text-green font-semibold">Req: {formatCurrency(req.requested_amount)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Payment Confirmation */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title flex items-center gap-2 text-blue">
                <CreditCard size={16} /> Pending Payments ({pendingPayments.length})
              </h3>
              <button
                onClick={() => navigate('/payments')}
                className="btn btn-ghost btn-sm"
              >
                Review All <ArrowUpRight size={14} />
              </button>
            </div>
            {pendingPayments.length === 0 ? (
              <p className="text-muted text-sm py-2">No pending payments to confirm.</p>
            ) : (
              <div className="space-y-2">
                {pendingPayments.slice(0, 3).map(pay => (
                  <div key={pay.id} className="p-3 bg-input rounded flex items-center justify-between text-sm">
                    <div>
                      <div className="font-semibold">{pay.member?.name}</div>
                      <div className="text-xs text-muted">{pay.payment_method.toUpperCase()} • {pay.date}</div>
                    </div>
                    <div className="text-green font-bold text-base">
                      {formatCurrency(pay.amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Member Personal Summary Card (Req 12) */}
      <div className="card mb-6">
        <div className="card-header">
          <h3 className="card-title text-primary">My Monthly Overview ({member?.name})</h3>
          <button onClick={() => navigate('/report')} className="btn btn-ghost btn-sm">
            Full Balance Sheet <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="grid grid-4 gap-4">
          <div className="p-4 bg-input rounded">
            <div className="text-xs text-muted uppercase font-semibold">My Meals</div>
            <div className="text-xl font-bold text-green mt-1">
              {myBalance?.totalMeals ?? 0}
            </div>
            <div className="text-xs text-muted mt-1">
              Today: {myTodayMeal ? `${myTodayMeal.total_meal} meals` : 'Not set'}
            </div>
          </div>

          <div className="p-4 bg-input rounded">
            <div className="text-xs text-muted uppercase font-semibold">My Meal Cost</div>
            <div className="text-xl font-bold text-amber mt-1">
              {myBalance ? formatCurrency(myBalance.mealCost) : '৳0.00'}
            </div>
            <div className="text-xs text-muted mt-1">
              Meal Rate: {summary?.mealRate ? formatCurrency(summary.mealRate) : '৳0.00'}
            </div>
          </div>

          <div className="p-4 bg-input rounded">
            <div className="text-xs text-muted uppercase font-semibold">My Total Paid</div>
            <div className="text-xl font-bold text-blue mt-1">
              {myBalance ? formatCurrency(myBalance.totalPaid) : '৳0.00'}
            </div>
            <div className="text-xs text-muted mt-1">Confirmed payments</div>
          </div>

          <div className="p-4 bg-input rounded">
            <div className="text-xs text-muted uppercase font-semibold">My Balance</div>
            <div
              className={`text-xl font-bold mt-1 ${
                (myBalance?.balance ?? 0) >= 0 ? 'balance-positive' : 'balance-negative'
              }`}
            >
              {(myBalance?.balance ?? 0) >= 0
                ? `+${formatCurrency(myBalance?.balance ?? 0)}`
                : `-${formatCurrency(Math.abs(myBalance?.balance ?? 0))}`}
            </div>
            <div className="text-xs text-muted mt-1">
              {(myBalance?.balance ?? 0) >= 0 ? 'You will receive' : 'You need to pay'}
            </div>
          </div>
        </div>
      </div>

      {/* Member-wise Balances Preview Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Member-wise Balance Summary</h3>
          <button onClick={() => navigate('/report')} className="btn btn-ghost btn-sm">
            View Details <ArrowUpRight size={14} />
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Member</th>
                <th>Total Meals</th>
                <th>Meal Cost</th>
                <th>Paid</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {summary?.memberBalances.map(b => (
                <tr key={b.member.id}>
                  <td className="font-semibold flex items-center gap-2">
                    {b.member.name}
                    {b.member.id === activeMonth.manager_id && (
                      <span className="badge badge-manager text-xs">Manager</span>
                    )}
                  </td>
                  <td>{b.totalMeals}</td>
                  <td>{formatCurrency(b.mealCost)}</td>
                  <td className="text-green font-medium">{formatCurrency(b.totalPaid)}</td>
                  <td
                    className={`font-bold ${
                      b.balance >= 0 ? 'balance-positive' : 'balance-negative'
                    }`}
                  >
                    {b.balance >= 0 ? `+${formatCurrency(b.balance)}` : `-${formatCurrency(Math.abs(b.balance))}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}