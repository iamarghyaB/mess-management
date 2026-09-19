// src/pages/Payments.tsx

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useMonthContext } from '../contexts/MonthContext';
import { usePayments } from '../hooks/usePayments';
import { formatCurrency } from '../lib/supabase';
import { CreditCard, Plus, Check, X, Clock, AlertCircle } from 'lucide-react';

export default function Payments() {
  const { member } = useAuthContext();
  const { activeMonth, isCurrentManager } = useMonthContext();
  const { payments, loading, submitPayment, reviewPayment } = usePayments();

  const [showAddModal, setShowAddModal] = useState(false);
  const [amount, setAmount] = useState<number>(0);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [method, setMethod] = useState<'cash' | 'bkash' | 'nagad' | 'bank' | 'other'>('cash');
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const isClosed = activeMonth?.status === 'closed';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return alert('Please enter a valid amount');
    setSubmitting(true);

    try {
      await submitPayment(amount, date, method, note);
      setShowAddModal(false);
      setAmount(0);
      setNote('');
    } catch (err: any) {
      alert(err.message || 'Error submitting payment');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Payment Management</h1>
          <p className="section-subtitle">
            Submit monthly payment contributions. Current manager verifies and confirms payments.
          </p>
        </div>

        {!isClosed && (
          <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
            <Plus size={16} /> Submit Payment
          </button>
        )}
      </div>

      {loading ? (
        <div className="loading-screen text-center py-12">
          <div className="spinner" />
          <p className="mt-2 text-sm text-muted">Loading payments...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Payments for Manager Review */}
          {isCurrentManager && payments.filter(p => p.status === 'pending').length > 0 && (
            <div className="card border-blue-500/40 bg-blue-500/5">
              <div className="card-header">
                <h3 className="card-title text-blue flex items-center gap-2">
                  <Clock size={16} /> Pending Payment Approvals (
                  {payments.filter(p => p.status === 'pending').length})
                </h3>
              </div>

              <div className="space-y-3">
                {payments
                  .filter(p => p.status === 'pending')
                  .map(pay => (
                    <div
                      key={pay.id}
                      className="p-4 bg-card border border-border rounded-lg flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-lg">{pay.member?.name}</div>
                        <div className="text-xs text-muted flex items-center gap-2 mt-0.5">
                          <span>Date: {pay.date}</span>
                          <span className="badge badge-manager">{pay.payment_method.toUpperCase()}</span>
                        </div>
                        {pay.note && (
                          <div className="text-xs text-secondary mt-1 italic">Note: {pay.note}</div>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-2xl font-bold text-green">
                          {formatCurrency(pay.amount)}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => reviewPayment(pay.id, 'confirmed')}
                            className="btn btn-success btn-sm"
                          >
                            <Check size={14} /> Confirm
                          </button>
                          <button
                            onClick={() => reviewPayment(pay.id, 'rejected')}
                            className="btn btn-danger btn-sm"
                          >
                            <X size={14} /> Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* All Payment History Table */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Payment History</h3>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Date</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-6 text-muted">
                        No payments recorded for this month.
                      </td>
                    </tr>
                  ) : (
                    payments.map(pay => (
                      <tr key={pay.id}>
                        <td className="font-semibold">{pay.member?.name}</td>
                        <td className="text-xs text-muted">{pay.date}</td>
                        <td>
                          <span className="badge badge-member">{pay.payment_method.toUpperCase()}</span>
                        </td>
                        <td className="font-bold text-green">{formatCurrency(pay.amount)}</td>
                        <td>
                          <span
                            className={`badge ${
                              pay.status === 'confirmed'
                                ? 'badge-confirmed'
                                : pay.status === 'pending'
                                ? 'badge-pending'
                                : 'badge-rejected'
                            }`}
                          >
                            {pay.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-xs text-muted">{pay.note || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Submit Payment Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Submit Monthly Payment</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Payment Amount (৳)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount || ''}
                    onChange={e => setAmount(parseFloat(e.target.value))}
                    placeholder="e.g. 2000"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select
                    value={method}
                    onChange={e => setMethod(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="cash">Cash Handover</option>
                    <option value="bkash">bKash Transfer</option>
                    <option value="nagad">Nagad Transfer</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Transaction Reference / Note</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="e.g. bKash TxID: 8N2K... or Handed cash to manager"
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
