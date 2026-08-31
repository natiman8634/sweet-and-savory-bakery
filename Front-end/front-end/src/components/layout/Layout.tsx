import { useState, useEffect } from 'react';
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
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);  const sidebarWidth = showSidebar && isDesktop ? (!sidebarCollapsed ? 256 : 60) : 0;

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      {/* Sidebar - full height, fixed left */}
      {showSidebar && (
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      )}

      {/* Right side: navbar + content */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: sidebarWidth }}>
        <Navbar />
        <main className="flex-1 pb-20 md:pb-6">
          <Outlet />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
}