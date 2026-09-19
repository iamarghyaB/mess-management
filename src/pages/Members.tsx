// src/pages/Members.tsx

import React, { useState } from 'react';
import { useMembers } from '../hooks/useMembers';
import { useMonthContext } from '../contexts/MonthContext';
import { UserPlus, UserCheck, UserX, Phone, Mail, Calendar, ShieldAlert } from 'lucide-react';

export default function Members() {
  const { members, loading, addMember, setMemberStatus } = useMembers();
  const { isCurrentManager } = useMonthContext();

  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCurrentManager) {
    return (
      <div className="card text-center py-12">
        <ShieldAlert size={48} className="text-amber mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Manager Access Required</h2>
        <p className="text-secondary">Only the current month's manager can manage members.</p>
      </div>
    );
  }

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await addMember({ name, email, phone });
      setName('');
      setEmail('');
      setPhone('');
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h1 className="section-title">Member Management</h1>
          <p className="section-subtitle">
            View, add, and deactivate mess members. Historical data is preserved.
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn btn-primary">
          <UserPlus size={16} /> Add Member
        </button>
      </div>

      {loading ? (
        <div className="loading-screen text-center py-12">
          <div className="spinner" />
          <p className="mt-2 text-sm text-muted">Loading members...</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Member Name</th>
                  <th>Contact Info</th>
                  <th>Joining Date</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {members.map(m => (
                  <tr key={m.id}>
                    <td className="font-semibold">
                      <div>{m.name}</div>
                    </td>
                    <td>
                      <div className="text-xs text-secondary flex items-center gap-1">
                        <Mail size={12} /> {m.email}
                      </div>
                      {m.phone && (
                        <div className="text-xs text-muted flex items-center gap-1 mt-0.5">
                          <Phone size={12} /> {m.phone}
                        </div>
                      )}
                    </td>
                    <td className="text-xs text-muted">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} /> {m.joining_date}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          m.status === 'active' ? 'badge-active' : 'badge-inactive'
                        }`}
                      >
                        {m.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-right">
                      {m.status === 'active' ? (
                        <button
                          onClick={() => setMemberStatus(m.id, 'inactive')}
                          className="btn btn-ghost btn-sm text-red"
                          title="Deactivate member (Preserves history)"
                        >
                          <UserX size={14} /> Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => setMemberStatus(m.id, 'active')}
                          className="btn btn-ghost btn-sm text-green"
                        >
                          <UserCheck size={14} /> Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal modal-md">
            <div className="modal-header">
              <h3 className="modal-title">Add New Mess Member</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddMember}>
              <div className="modal-body">
                {error && <div className="alert alert-error mb-4">{error}</div>}

                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Karim Ahmed"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="karim@example.com"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+8801700000000"
                    className="form-input"
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
                  {submitting ? 'Adding...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
