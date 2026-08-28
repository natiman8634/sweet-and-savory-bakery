import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');
  const showSidebar = user?.role === 'Admin' && isAdminRoute;
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const sidebarWidth = showSidebar ? (sidebarCollapsed ? 72 : 256) : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar - full height, fixed left */}
      {showSidebar && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}

      {/* Right side: navbar + content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar sidebarWidth={sidebarWidth} />
        <main className="flex-1 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}