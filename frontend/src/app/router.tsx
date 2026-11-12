import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { FournisseursPage } from '../modules/fournisseurs/pages/FournisseursPage';
import { CommandesPage } from '../modules/commandes/pages/CommandesPage';
import { ReceptionsPage } from '../modules/receptions/pages/ReceptionsPage';
import { FacturesPage } from '../modules/factures/pages/FacturesPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/fournisseurs" replace />,
      },
      {
        path: 'fournisseurs',
        element: <FournisseursPage />,
      },
      {
        path: 'commandes',
        element: <CommandesPage />,
      },
      {
        path: 'receptions',
        element: <ReceptionsPage />,
      },
      {
        path: 'factures',
        element: <FacturesPage />,
      },
      {
        path: '*',
        element: <Navigate to="/fournisseurs" replace />,
      },
    ],
  },
]);

