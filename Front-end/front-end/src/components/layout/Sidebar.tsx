import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingBag, Users, Home } from 'lucide-react';
import { cn } from '../../lib/utils';

const sidebarLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/', label: 'Back to Shop', icon: Home },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="w-64 min-h-[calc(100vh-4rem)] bg-white border-r hidden lg:block p-4">
      <div className="space-y-1">
        {sidebarLinks.map((link) => {
          const isActive = location.pathname === link.to || 
            (link.to !== '/' && location.pathname.startsWith(link.to));
          
          return (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-amber-50 text-amber-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <link.icon className="h-5 w-5" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}