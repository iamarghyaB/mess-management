// src/pages/Bazar.tsx

import React, { useState } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { useMonthContext } from '../contexts/MonthContext';
import { useBazar } from '../hooks/useBazar';
import { useCorrectionRequests } from '../hooks/useCorrectionRequests';
import { formatCurrency } from '../lib/supabase';
import { Bazar, BazarAudit } from '../types/models';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Clock,
  History,
  Check,
  X,
  AlertCircle,
  Lock,
} from 'lucide-react';

export default function BazarPage() {
  const { member } = useAuthContext();
  const { activeMonth, isCurrentManager } = useMonthContext();
  const { bazars, loading, addBazar, updateBazar, getBazarAudit } = useBazar();
  const { requests, requestCorrection, reviewCorrection } = useCorrectionRequests();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBazar, setEditingBazar] = useState<Bazar | null>(null);

  const [showCorrectionModal, setShowCorrectionModal] = useState<Bazar | null>(null);
  const [requestedAmount, setRequestedAmount] = useState<number>(0);
  const [correctionReason, setCorrectionReason] = useState<string>('');

  const [auditBazar, setAuditBazar] = useState<Bazar | null>(null);
  const [auditLogs, setAuditLogs] = useState<BazarAudit[]>([]);

  // Itemized Form State
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<{ item_name: string; price: number }[]>([
    { item_name: '', price: 0 },
  ]);
  const [note, setNote] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  const isClosed = activeMonth?.status === 'closed';
  const todayStr = new Date().toISOString().split('T')[0];

  const handleAddItemRow = () => {
    setItems([...items, { item_name: '', price: 0 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'item_name' | 'price', value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const totalFormAmount = items.reduce((sum, i) => sum + (Number(i.price) || 0), 0);

  const handleSubmitBazar = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const validItems = items
        .filter(i => i.item_name.trim() && i.price > 0)
        .map(i => ({ item_name: i.item_name.trim(), quantity: 1, price: Number(i.price) }));

      if (validItems.length === 0) {
        alert('Please add at least one valid item name and price.');
        setSubmitting(false);
        return;
      }

      if (editingBazar) {
        await updateBazar(editingBazar.id, validItems, note);
      } else {
        await addBazar(date, validItems, note);
      }
      setShowAddModal(false);
      setEditingBazar(null);
      resetForm();
    } catch (err: any) {
      alert(err.message || 'Error saving Bazar');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setDate(todayStr);
    setItems([{ item_name: '', price: 0 }]);
    setNote('');
  };

  const openEditModal = (bazar: Bazar) => {
    setEditingBazar(bazar);
    setDate(bazar.date);
    setItems(
      bazar.items && bazar.items.length > 0
        ? bazar.items.map(i => ({ item_name: i.item_name, price: i.price }))
        : [{ item_name: 'Bazar Purchase', price: bazar.total_amount }]
    );
    setNote(bazar.note || '');
    setShowAddModal(true);
  };

  const handleRequestCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showCorrectionModal) return;

    try {
      await requestCorrection(
        showCorrectionModal.id,
        showCorrectionModal.total_amount,
        requestedAmount,
        correctionReason
      );
      setShowCorrectionModal(null);
      setCorrectionReason('');
    } catch (err: any) {
      alert(err.message || 'Failed to submit correction request');
    }
  };

  const openAuditModal = async (bazar: Bazar) => {
    setAuditBazar(bazar);
    const logs = await getBazarAudit(bazar.id);
    setAuditLogs(logs);
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Bazar & Expense Management</h1>
          <p className="section-subtitle">
            Record market purchases. Same-day owner edit or manager correction approval.
          </p>
        </div>

        {!isClosed && (
          <button
            onClick={() => {
              resetForm();
              setEditingBazar(null);
              setShowAddModal(true);
            }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Record Bazar
          </button>
        )}
      </div>

      {/* Pending Correction Requests for Manager */}
      {isCurrentManager && requests.filter(r => r.status === 'pending').length > 0 && (
        <div className="card mb-6 border-amber-500/40 bg-amber-500/5">
          <div className="card-header">
            <h3 className="card-title text-amber flex items-center gap-2">
              <AlertCircle size={16} /> Pending Bazar Correction Requests
            </h3>
          </div>
          <div className="space-y-3">
            {requests
              .filter(r => r.status === 'pending')
              .map(req => (
                <div
                  key={req.id}
                  className="p-3 bg-card border border-border rounded-lg flex items-center justify-between"
                >
                  <div>
                    <div className="font-semibold">{req.requester?.name}</div>
                    <div className="text-xs text-muted">Reason: {req.reason}</div>
                    <div className="text-xs text-secondary mt-1">
                      Old: {formatCurrency(req.old_amount)} → Requested: {formatCurrency(req.requested_amount)}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => reviewCorrection(req.id, true)}
                      className="btn btn-success btn-sm"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      onClick={() => reviewCorrection(req.id, false)}
                      className="btn btn-danger btn-sm"
                    >
                      <X size={14} /> Reject
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Bazar Entries List */}
      {loading ? (
        <div className="loading-screen text-center py-12">
          <div className="spinner" />
          <p className="mt-2 text-sm text-muted">Loading bazar records...</p>
        </div>
      ) : bazars.length === 0 ? (
        <div className="empty-state card">
          <ShoppingBag size={48} />
          <h3>No Bazar Purchases Recorded</h3>
          <p>Click "Record Bazar" to add the first market shopping entry for this month.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bazars.map(bazar => {
            const isOwner = bazar.purchased_by === member?.id;
            const isSameDay = bazar.date === todayStr;
            const approvedReq = requests.find(
              r => r.bazar_id === bazar.id && r.requested_by === member?.id && r.status === 'approved' && !r.edit_used_at
            );
            const canEdit = !isClosed && (isCurrentManager || (isOwner && isSameDay) || Boolean(approvedReq));
            const canRequestCorrection = !isClosed && isOwner && !isSameDay && !approvedReq;

            return (
              <div key={bazar.id} className="card">
                <div className="card-header">
                  <div className="flex items-center gap-3">
                    <div className="stat-icon amber p-2">
                      <ShoppingBag size={20} />
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{bazar.purchaser?.name}</div>
                      <div className="text-xs text-muted flex items-center gap-2">
                        <span>Date: {bazar.date}</span>
                        {isSameDay && <span className="badge badge-active">Today</span>}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber">
                      {formatCurrency(bazar.total_amount)}
                    </div>
                    <div className="flex gap-2 justify-end mt-2">
                      <button
                        onClick={() => openAuditModal(bazar)}
                        className="btn btn-ghost btn-sm"
                        title="View audit history"
                      >
                        <History size={14} /> Audit
                      </button>

                      {canEdit && (
                        <button
                          onClick={() => openEditModal(bazar)}
                          className="btn btn-primary btn-sm"
                        >
                          <Edit2 size={14} /> Edit
                        </button>
                      )}

                      {canRequestCorrection && (
                        <button
                          onClick={() => {
                            setShowCorrectionModal(bazar);
                            setRequestedAmount(bazar.total_amount);
                          }}
                          className="btn btn-warning btn-sm"
                        >
                          <Clock size={14} /> Request Correction
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Items breakdown */}
                {bazar.items && bazar.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-3 gap-2">
                    {bazar.items.map(item => (
                      <div key={item.id} className="p-2 bg-input rounded text-xs flex justify-between">
                        <span>{item.item_name}</span>
                        <strong className="text-primary">{formatCurrency(item.price)}</strong>
                      </div>
                    ))}
                  </div>
                )}

                {bazar.note && (
                  <div className="mt-2 text-xs text-secondary italic">Note: {bazar.note}</div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Bazar Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal modal-lg">
            <div className="modal-header">
              <h3 className="modal-title">
                {editingBazar ? 'Edit Bazar Entry' : 'Record New Bazar Purchase'}
              </h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitBazar}>
              <div className="modal-body space-y-4">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="form-label mb-0">Today Purchased Items</label>
                    <button
                      type="button"
                      onClick={handleAddItemRow}
                      className="btn btn-ghost btn-sm text-blue"
                    >
                      + Add Item Row
                    </button>
                  </div>

                  <div className="space-y-2">
                    {items.map((item, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Item Name (e.g. Rice, Chicken)"
                          value={item.item_name}
                          onChange={e => handleItemChange(idx, 'item_name', e.target.value)}
                          className="form-input flex-1 w-1/2"
                        />
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Price (৳)"
                          value={item.price || ''}
                          onChange={e => handleItemChange(idx, 'price', parseFloat(e.target.value))}
                          className="form-input flex-1 w-1/2"
                        />
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItemRow(idx)}
                            className="btn btn-ghost btn-sm text-red"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-right font-bold text-amber">
                    Total Amount: {formatCurrency(totalFormAmount)}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    rows={2}
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Any comments or grocery vendor details..."
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
                  {submitting ? 'Saving...' : 'Save Bazar Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Correction Modal */}
      {showCorrectionModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Request Bazar Correction</h3>
              <button onClick={() => setShowCorrectionModal(null)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestCorrection}>
              <div className="modal-body space-y-4">
                <p className="text-xs text-secondary">
                  Since the bazar date ({showCorrectionModal.date}) has passed, your correction request will be sent to the month manager for approval.
                </p>

                <div className="form-group">
                  <label className="form-label">Original Amount</label>
                  <input
                    type="text"
                    disabled
                    value={formatCurrency(showCorrectionModal.total_amount)}
                    className="form-input opacity-50"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Requested Correct Amount (৳)</label>
                  <input
                    type="number"
                    required
                    value={requestedAmount}
                    onChange={e => setRequestedAmount(parseFloat(e.target.value))}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reason for Correction</label>
                  <textarea
                    required
                    rows={3}
                    value={correctionReason}
                    onChange={e => setCorrectionReason(e.target.value)}
                    placeholder="e.g. Entered chicken price incorrectly as ৳500 instead of ৳550"
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Audit History Modal */}
      {auditBazar && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Bazar Audit History</h3>
              <button onClick={() => setAuditBazar(null)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="audit-log">
                {auditLogs.length === 0 ? (
                  <p className="text-muted text-sm text-center py-4">No audit logs available.</p>
                ) : (
                  auditLogs.map(log => (
                    <div key={log.id} className="audit-item">
                      <div className="audit-dot" />
                      <div className="audit-content">
                        <div className="audit-action">{log.note || log.action}</div>
                        <div className="audit-meta">
                          By: {log.performer?.name || 'User'} • {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
