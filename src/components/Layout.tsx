// src/components/Layout.tsx

import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  UtensilsCrossed,
  ShoppingBag,
  CreditCard,
  FileSpreadsheet,
  CalendarDays,
  LogOut,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';
import { useAuthContext } from '../contexts/AuthContext';
import { useMonthContext } from '../contexts/MonthContext';
import { MonthBadge } from './MonthBadge';
import { useCorrectionRequests } from '../hooks/useCorrectionRequests';
import { usePayments } from '../hooks/usePayments';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { member, signOut } = useAuthContext();
  const { activeMonth, isCurrentManager } = useMonthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const { pendingRequests } = useCorrectionRequests();
  const { pendingPayments } = usePayments();

  const isClosed = activeMonth?.status === 'closed';

  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/meals', label: 'Daily Meals', icon: UtensilsCrossed },
    { path: '/bazar', label: 'Bazar / Expenses', icon: ShoppingBag, badge: isCurrentManager ? pendingRequests.length : 0 },
    { path: '/payments', label: 'Payments', icon: CreditCard, badge: isCurrentManager ? pendingPayments.length : 0 },
    { path: '/report', label: 'Balance Sheet', icon: FileSpreadsheet },
  ];

  if (isCurrentManager) {
    navItems.push({ path: '/members', label: 'Members', icon: Users, badge: 0 });
    navItems.push({ path: '/month-management', label: 'Month Control', icon: CalendarDays, badge: 0 });
  }

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h1>Mess Control</h1>
          <p>Monthly Management</p>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Menu</div>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
                {Boolean(item.badge && item.badge > 0) && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-bottom">
          {member && (
            <div className="user-card mb-2">
              <div className="user-avatar">
                {member.name.charAt(0).toUpperCase()}
              </div>
              <div className="user-info">
                <div className="user-name">{member.name}</div>
                <div className="user-role flex items-center gap-1">
                  {isCurrentManager && <ShieldCheck size={12} className="text-blue" />}
                  {isCurrentManager ? 'Manager' : 'Member'}
                </div>
              </div>
            </div>
          )}

          <button onClick={handleSignOut} className="nav-item text-red w-full">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="btn btn-ghost btn-icon md:hidden"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="topbar-title">
            <MonthBadge month={activeMonth} />
          </div>

          {activeMonth?.manager && (
            <div className="text-xs text-secondary hidden sm:flex items-center gap-2 bg-card px-3 py-1.5 rounded-full border border-border">
              <span>Manager:</span>
              <strong className="text-primary">{activeMonth.manager.name}</strong>
            </div>
          )}
        </header>

        <main className="page-content">
          {isClosed && (
            <div className="readonly-banner">
              <Lock size={16} />
              <span>
                <strong>This month ({activeMonth?.month}/{activeMonth?.year}) is Closed.</strong> All meal, bazar, and payment records are read-only.
              </span>
            </div>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}