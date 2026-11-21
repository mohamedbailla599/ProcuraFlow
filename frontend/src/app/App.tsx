import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { FournisseursPage } from '../modules/fournisseurs/pages/FournisseursPage';
import { CommandesPage } from '../modules/commandes/pages/CommandesPage';
import { ReceptionsPage } from '../modules/receptions/pages/ReceptionsPage';
import { FacturesPage } from '../modules/factures/pages/FacturesPage';
import { ThemeProvider } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <BrowserRouter useTransitions={false}>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="dashboard/*" element={<DashboardPage />} />
              <Route path="fournisseurs" element={<FournisseursPage />} />
              <Route path="fournisseurs/*" element={<FournisseursPage />} />
              <Route path="commandes" element={<CommandesPage />} />
              <Route path="commandes/*" element={<CommandesPage />} />
              <Route path="receptions" element={<ReceptionsPage />} />
              <Route path="receptions/*" element={<ReceptionsPage />} />
              <Route path="factures" element={<FacturesPage />} />
              <Route path="factures/*" element={<FacturesPage />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}


