import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { Home, Package, ShoppingCart, User, ClipboardList } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

export default function MobileBottomNav() {
  const location = useLocation();
  const { totalItems } = useCart();
  const { user } = useAuth();

  // Define navigation items
  const navItems = [
    {
      to: '/',
      label: 'Home',
      icon: Home,
      show: true,
    },
    {
      to: '/products',
      label: 'Products',
      icon: Package,
      show: true,
    },
    {
      to: '/cart',
      label: 'Cart',
      icon: ShoppingCart,
      show: true,
      badge: totalItems > 0 ? totalItems : undefined,
    },
    {
      to: '/orders',
      label: 'Orders',
      icon: ClipboardList,
      show: !!user, // Only show if logged in
    },
    {
      to: '/profile',
      label: 'Profile',
      icon: User,
      show: !!user, // Only show if logged in
    },
  ];

  // Filter items that should be shown
  const visibleItems = navItems.filter((item) => item.show);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.to || 
            (item.to !== '/' && location.pathname.startsWith(item.to));

          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-colors relative',
                isActive
                  ? 'text-amber-700'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <div className="relative">
                <item.icon className={cn(
                  'h-5 w-5 transition-transform',
                  isActive && 'scale-110'
                )} />
                {item.badge && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-amber-700 border-2 border-white">
                    {item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-amber-700' : 'text-gray-500'
              )}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-amber-700 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}