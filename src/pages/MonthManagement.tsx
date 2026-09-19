// src/pages/MonthManagement.tsx

import React, { useState, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useMonthContext } from '../contexts/MonthContext';
import { useMembers } from '../hooks/useMembers';
import { useCorrectionRequests } from '../hooks/useCorrectionRequests';
import { usePayments } from '../hooks/usePayments';
import { supabase, TABLES, MONTH_NAMES, formatMonthYear } from '../lib/supabase';
import { Calendar, Plus, Lock, CheckCircle2, ShieldAlert, AlertTriangle, UserCheck } from 'lucide-react';
import { Member } from '../types/models';

export default function MonthManagement() {
  const { member, user } = useAuthContext();
  const { activeMonth, allMonths, refresh, isCurrentManager } = useMonthContext();
  const { members, refresh: refreshMembers } = useMembers();
  const { pendingRequests } = useCorrectionRequests();
  const { pendingPayments } = usePayments();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMonthNum, setSelectedMonthNum] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [newManagerName, setNewManagerName] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [showCloseModal, setShowCloseModal] = useState(false);

  // Combine members list with current logged-in member as fallback
  const availableMembers: Member[] = [...members];
  if (member && !availableMembers.some(m => m.id === member.id)) {
    availableMembers.unshift(member);
  }

  useEffect(() => {
    if (member && !selectedManagerId) {
      setSelectedManagerId(member.id);
    } else if (availableMembers.length > 0 && !selectedManagerId) {
      setSelectedManagerId(availableMembers[0].id);
    }
  }, [member, availableMembers]);

  const handleCreateMonth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      let managerIdToAssign = selectedManagerId;

      // If user typed a new manager name directly (fallback)
      if (!managerIdToAssign && newManagerName.trim()) {
        const { data: createdMem, error: memErr } = await supabase
          .from(TABLES.MEMBERS)
          .insert({
            name: newManagerName.trim(),
            email: user?.email || `${newManagerName.toLowerCase().replace(/\s+/g, '')}@mess.local`,
            user_id: user?.id ?? null,
            joining_date: new Date().toISOString().split('T')[0],
            status: 'active',
          })
          .select()
          .single();

        if (memErr) throw memErr;
        managerIdToAssign = createdMem.id;
        await refreshMembers();
      }

      if (!managerIdToAssign) {
        throw new Error('Please select or enter a manager name for this month');
      }

      const { error: err } = await supabase.from(TABLES.MONTHS).insert({
        month: selectedMonthNum,
        year: selectedYear,
        manager_id: managerIdToAssign,
        status: 'active',
      });

      if (err) throw err;
      await refresh();
      setShowCreateModal(false);
    } catch (err: any) {
      console.error('Error creating month:', err);
      setError(err.message || 'Failed to create new month. Ensure month/year is unique.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseMonth = async () => {
    if (!activeMonth) return;
    setSubmitting(true);

    try {
      const { error: err } = await supabase
        .from(TABLES.MONTHS)
        .update({
          status: 'closed',
          closed_at: new Date().toISOString(),
        })
        .eq('id', activeMonth.id);

      if (err) throw err;
      await refresh();
      setShowCloseModal(false);
    } catch (err: any) {
      alert(err.message || 'Failed to close month');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Month & Manager Control</h1>
          <p className="section-subtitle">
            Manage active/closed monthly periods and assign per-month managers.
          </p>
        </div>

        <button
          onClick={() => {
            setError(null);
            setShowCreateModal(true);
          }}
          className="btn btn-primary"
        >
          <Plus size={16} /> Start New Month
        </button>
      </div>

      {/* Active Month Actions */}
      {activeMonth && activeMonth.status === 'active' && (
        <div className="card mb-6 border-blue-500/40 bg-card">
          <div className="card-header">
            <div>
              <div className="text-xs text-blue uppercase font-semibold">Current Active Month</div>
              <h2 className="text-2xl font-bold mt-1">
                {formatMonthYear(activeMonth.month, activeMonth.year)}
              </h2>
              <div className="text-xs text-secondary mt-1">
                Manager: <strong>{activeMonth.manager?.name || 'Unassigned'}</strong>
              </div>
            </div>

            {isCurrentManager && (
              <button onClick={() => setShowCloseModal(true)} className="btn btn-warning">
                <Lock size={16} /> Close Current Month
              </button>
            )}
          </div>
        </div>
      )}

      {/* Monthly History List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Monthly Records</h3>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Month & Year</th>
                <th>Assigned Manager</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Closed At</th>
              </tr>
            </thead>
            <tbody>
              {allMonths.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-muted">
                    No months created yet. Click "Start New Month" above.
                  </td>
                </tr>
              ) : (
                allMonths.map(m => (
                  <tr key={m.id}>
                    <td className="font-semibold">{formatMonthYear(m.month, m.year)}</td>
                    <td>{m.manager?.name || '-'}</td>
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'active' ? 'badge-active' : 'badge-closed'
                        }`}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-xs text-muted">
                      {new Date(m.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-xs text-muted">
                      {m.closed_at ? new Date(m.closed_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Month Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Start New Month Period</h3>
              <button onClick={() => setShowCreateModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMonth}>
              <div className="modal-body space-y-4">
                {error && <div className="alert alert-error">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Select Month</label>
                  <select
                    value={selectedMonthNum}
                    onChange={e => setSelectedMonthNum(parseInt(e.target.value))}
                    className="form-select"
                  >
                    {MONTH_NAMES.map((name, idx) => (
                      <option key={idx} value={idx + 1}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Year</label>
                  <input
                    type="number"
                    required
                    value={selectedYear}
                    onChange={e => setSelectedYear(parseInt(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Assign Manager for this Month</label>
                  {availableMembers.length > 0 ? (
                    <select
                      value={selectedManagerId}
                      onChange={e => {
                        setSelectedManagerId(e.target.value);
                        setNewManagerName('');
                      }}
                      className="form-select"
                      required={!newManagerName}
                    >
                      <option value="">-- Select Manager --</option>
                      {availableMembers.map(mem => (
                        <option key={mem.id} value={mem.id}>
                          {mem.name} ({mem.email}) {mem.id === member?.id ? ' (You)' : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-amber">
                        No existing members found. Enter the Manager's name below:
                      </p>
                      <input
                        type="text"
                        required
                        value={newManagerName}
                        onChange={e => setNewManagerName(e.target.value)}
                        placeholder="Manager Name (e.g. Arghya)"
                        className="form-input"
                      />
                    </div>
                  )}

                  <p className="text-xs text-muted mt-1">
                    The selected member will get full management permissions for this month.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Creating...' : 'Create Month'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close Month Modal */}
      {showCloseModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title flex items-center gap-2 text-warning">
                <AlertTriangle size={20} /> Close Month Confirmation
              </h3>
              <button onClick={() => setShowCloseModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <div className="modal-body space-y-4">
              <p className="text-sm">
                Are you sure you want to close{' '}
                <strong>{formatMonthYear(activeMonth!.month, activeMonth!.year)}</strong>?
              </p>

              {(pendingRequests.length > 0 || pendingPayments.length > 0) && (
                <div className="alert alert-warning text-xs space-y-1">
                  <strong>Warning: Unresolved Pending Requests!</strong>
                  {pendingRequests.length > 0 && (
                    <div>• {pendingRequests.length} pending bazar correction request(s)</div>
                  )}
                  {pendingPayments.length > 0 && (
                    <div>• {pendingPayments.length} pending payment verification(s)</div>
                  )}
                </div>
              )}

              <ul className="text-xs text-muted space-y-1 list-disc pl-4">
                <li>Meal records for this month will become read-only.</li>
                <li>Bazar & payment records will be frozen.</li>
                <li>You will lose manager editing permissions for this month.</li>
              </ul>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setShowCloseModal(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCloseMonth}
                disabled={submitting}
                className="btn btn-warning"
              >
                {submitting ? 'Closing...' : 'Yes, Freeze & Close Month'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
