// src/App.tsx

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { MonthProvider } from './contexts/MonthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Meals from './pages/Meals';
import Bazar from './pages/Bazar';
import Payments from './pages/Payments';
import MonthlyReport from './pages/MonthlyReport';
import Members from './pages/Members';
import MonthManagement from './pages/MonthManagement';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MonthProvider>
          <Routes>
            {/* Public Auth Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Layout />}>
                <Route index element={<Dashboard />} />
                <Route path="meals" element={<Meals />} />
                <Route path="bazar" element={<Bazar />} />
                <Route path="payments" element={<Payments />} />
                <Route path="report" element={<MonthlyReport />} />
                <Route path="members" element={<Members />} />
                <Route path="month-management" element={<MonthManagement />} />
              </Route>
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MonthProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
