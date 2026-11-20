import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { GlobalCommandPalette } from './GlobalCommandPalette';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout: React.FC = () => {
  const { isDarkMode } = useTheme();
  const location = useLocation();

  return (
    <div
      className={`h-screen flex overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 ${
        isDarkMode ? 'dark' : ''
      }`}
    >
      {/* Global Command Palette (Ctrl + K) */}
      <GlobalCommandPalette />

      {/* Global Sidebar (Desktop & Mobile Drawer) */}
      <Sidebar />

      {/* Main Column: Header + Scrollable Workspace */}
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Topbar />
        <main
          key={location.pathname}
          id="main-content"
          tabIndex={-1}
          className="flex-1 w-full overflow-y-auto overflow-x-hidden focus:outline-none scroll-smooth"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};
