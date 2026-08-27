import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { cn } from '../../lib/utils';
import MobileBottomNav from './MobileBottomNav';

export default function Layout() {
  const { user } = useAuth();
  const isAdminRoute = window.location.pathname.startsWith('/admin');
  const showSidebar = user?.role === 'Admin' && isAdminRoute;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        {showSidebar && <Sidebar />}
        <main className={cn('flex-1 pb-20 md:pb-6', showSidebar ? 'lg:ml-0' : '')}>
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}