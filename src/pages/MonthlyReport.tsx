// src/pages/MonthlyReport.tsx

import React from 'react';
import { useMonthContext } from '../contexts/MonthContext';
import { useBalance } from '../hooks/useBalance';
import { formatCurrency, formatMonthYear } from '../lib/supabase';
import { Calculator, DollarSign, Utensils, Download, AlertCircle } from 'lucide-react';

export default function MonthlyReport() {
  const { activeMonth } = useMonthContext();
  const { summary, loading } = useBalance();

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">
            {activeMonth ? formatMonthYear(activeMonth.month, activeMonth.year) : ''} Balance Sheet
          </h1>
          <p className="section-subtitle">
            Automatic meal rate calculation and member-by-member account summary.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="btn btn-ghost"
          title="Print or export as PDF"
        >
          <Download size={16} /> Export / Print
        </button>
      </div>

      {loading ? (
        <div className="loading-screen text-center py-12">
          <div className="spinner" />
          <p className="mt-2 text-sm text-muted">Calculating monthly balance sheet...</p>
        </div>
      ) : !summary ? (
        <div className="card text-center py-8 text-muted">
          No data available to generate report.
        </div>
      ) : (
        <div className="space-y-6">
          {/* Formula & Calculation Explainer Box (Req 9) */}
          <div className="card bg-card border-purple-500/30">
            <div className="card-header mb-2">
              <h3 className="card-title text-purple flex items-center gap-2">
                <Calculator size={18} /> Automatic Meal Rate Calculation Formula
              </h3>
            </div>
            <div className="grid grid-3 gap-4">
              <div className="p-3 bg-input rounded text-center">
                <div className="text-xs text-muted uppercase font-semibold">Total Food Expense</div>
                <div className="text-xl font-bold text-amber mt-1">
                  {formatCurrency(summary.foodExpense)}
                </div>
              </div>
              <div className="p-3 bg-input rounded text-center">
                <div className="text-xs text-muted uppercase font-semibold">Total Meals Consumed</div>
                <div className="text-xl font-bold text-green mt-1">{summary.totalMeals}</div>
              </div>
              <div className="p-3 bg-input rounded text-center">
                <div className="text-xs text-muted uppercase font-semibold">Calculated Meal Rate</div>
                <div className="text-xl font-bold text-purple mt-1">
                  {formatCurrency(summary.mealRate)} / meal
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mt-3 text-center">
              Formula: <code>Meal Rate = Total Food Expense / Total Meals</code> • Each Member's Meal Cost =
              <code> Member Meals × Meal Rate</code>
            </p>
          </div>

          {/* Member Balance Sheet Table (Req 10) */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Member Accounts & Net Balance</h3>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Total Meals</th>
                    <th>Meal Rate</th>
                    <th>Meal Cost</th>
                    <th>Other Cost</th>
                    <th>Total Payable</th>
                    <th>Paid Amount</th>
                    <th>Final Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.memberBalances.map(b => (
                    <tr key={b.member.id}>
                      <td className="font-semibold">{b.member.name}</td>
                      <td>{b.totalMeals}</td>
                      <td className="text-xs text-muted">{formatCurrency(summary.mealRate)}</td>
                      <td>{formatCurrency(b.mealCost)}</td>
                      <td>{formatCurrency(b.otherCostShare)}</td>
                      <td className="font-medium text-amber">{formatCurrency(b.totalPayable)}</td>
                      <td className="font-medium text-green">{formatCurrency(b.totalPaid)}</td>
                      <td>
                        <div
                          className={`font-bold ${
                            b.balance >= 0 ? 'balance-positive' : 'balance-negative'
                          }`}
                        >
                          {b.balance >= 0
                            ? `+${formatCurrency(b.balance)}`
                            : `-${formatCurrency(Math.abs(b.balance))}`}
                        </div>
                        <div className="text-[10px] text-muted">
                          {b.balance >= 0 ? 'Will receive' : 'Needs to pay'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Month Financial Summary Card */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Mess Financial Summary</h3>
            </div>
            <div className="grid grid-4 gap-4">
              <div className="p-3 bg-input rounded">
                <div className="text-xs text-muted uppercase font-semibold">Total Expenses</div>
                <div className="text-xl font-bold text-amber mt-1">
                  {formatCurrency(summary.totalExpense)}
                </div>
              </div>
              <div className="p-3 bg-input rounded">
                <div className="text-xs text-muted uppercase font-semibold">Total Collected</div>
                <div className="text-xl font-bold text-green mt-1">
                  {formatCurrency(summary.totalCollected)}
                </div>
              </div>
              <div className="p-3 bg-input rounded">
                <div className="text-xs text-muted uppercase font-semibold">Total Outstanding Due</div>
                <div className="text-xl font-bold text-red mt-1">
                  {formatCurrency(summary.totalDue)}
                </div>
              </div>
              <div className="p-3 bg-input rounded">
                <div className="text-xs text-muted uppercase font-semibold">Active Members</div>
                <div className="text-xl font-bold text-blue mt-1">{summary.totalMembers}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
