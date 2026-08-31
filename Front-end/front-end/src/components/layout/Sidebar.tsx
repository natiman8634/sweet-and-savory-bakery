import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Star, Settings, HelpCircle, LogOut, Cake, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../lib/utils';

const menuLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/reviews', label: 'Reviews', icon: Star },
];

const bottomLinks = [
  { to: '/profile', label: 'Settings', icon: Settings },
  { to: '/', label: 'Get Help', icon: HelpCircle },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-screen bg-white border-r border-gray-100 hidden lg:flex flex-col shadow-[2px_0_8px_rgba(0,0,0,0.04)] transition-all duration-300 ease-in-out z-50',
        collapsed ? 'w-[60px]' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn('border-b border-gray-100 flex items-center', collapsed ? 'px-3 py-5 justify-center' : 'px-6 py-5')}>
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
            <Cake className="h-5 w-5 text-red-600" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-gray-900 tracking-tight whitespace-nowrap">Sweet & Savory</span>
          )}
        </Link>
      </div>

      {/* Main Menu */}
      <div className="flex-1 px-3 py-4 overflow-y-auto">
        {!collapsed && (
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider px-3 mb-2">Menu</p>
        )}
        <div className="space-y-0.5">
          {menuLinks.map((link) => {
            const isActive = location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));

            return (
              <Link
                key={link.to}
                to={link.to}
                title={collapsed ? link.label : undefined}
                className={cn(
                  'flex items-center rounded-xl text-sm font-medium transition-all duration-200',
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-red-50 text-red-700 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <link.icon className={cn('h-4.5 w-4.5 shrink-0', isActive ? 'text-red-600' : 'text-gray-400')} />
                {!collapsed && link.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Bottom Section */}
      <div className="px-3 py-3 border-t border-gray-100">
        <div className="space-y-0.5">
          {bottomLinks.map((link) => (
            <Link
              key={link.to + link.label}
              to={link.to}
              title={collapsed ? link.label : undefined}
              className={cn(
                'flex items-center rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors',
                collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
              )}
            >
              <link.icon className="h-4.5 w-4.5 text-gray-400 shrink-0" />
              {!collapsed && link.label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            title={collapsed ? 'Log Out' : undefined}
            className={cn(
              'flex items-center rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors w-full',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5 text-left'
            )}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!collapsed && 'Log Out'}
          </button>
        </div>
      </div>

      {/* Circular Toggle Button - on right edge */}
      <button
        onClick={onToggle}
        className="absolute top-7 -right-3.5 z-50 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center text-gray-500 hover:text-gray-800 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer"
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? (
          <ChevronRight className="h-3.5 w-3.5" />
        ) : (
          <ChevronLeft className="h-3.5 w-3.5" />
        )}
      </button>
    </aside>
  );
}