import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu, ShoppingCart, LogOut, User, LayoutDashboard, Package, Home, ShoppingBag, Users, Star, Cake, ClipboardList } from 'lucide-react';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';

interface NavbarProps {
  sidebarWidth?: number;
}

export default function Navbar({ sidebarWidth = 0 }: NavbarProps) {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user?.profile?.full_name) return '?';
    return user.profile.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Navigation links (public)
  const navLinks = [
    { to: '/', label: 'Home', icon: Home },
    { to: '/products', label: 'Products', icon: Package },
    ...(user ? [{ to: '/orders', label: 'Orders', icon: ClipboardList }] : []),
  ];

  return (
    <nav
      style={{ marginLeft: sidebarWidth }}
      className="border-b border-gray-100 bg-white/95 backdrop-blur supports-backdrop-blur:bg-white/60 sticky top-0 z-40"
    >
      <div className="px-4 h-16 flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center">
          {/* Logo - only shown when no sidebar */}
          {!isAdminRoute && (
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <Cake className="h-4.5 w-4.5 text-red-600" />
              </div>
              <span className="text-lg font-bold text-gray-900 tracking-tight">Sweet & Savory</span>
            </Link>
          )}
        </div>

        {/* Center Navigation Links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.to ||
              (link.to !== '/' && location.pathname.startsWith(link.to));
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-red-50 text-red-700'
                    : 'text-red-600 hover:bg-red-50 hover:text-red-700'
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-4">
          {/* Cart Icon */}
          <Link to="/cart" className="relative text-gray-500 hover:text-red-600 transition-colors">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-red-600 text-white border-2 border-white">
                {totalItems}
              </Badge>
            )}
          </Link>

          {/* Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<button className="flex items-center gap-2 hover:opacity-80 cursor-pointer" />}
              >
                <Avatar className="h-8 w-8 bg-red-100">
                  <AvatarFallback className="text-red-700 text-sm font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden lg:inline text-gray-700">
                  {user.profile?.full_name || 'User'}
                </span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  {user.role === 'Admin' && (
                    <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-red-600 font-medium">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-red-600 text-white hover:bg-red-700 font-medium">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          {/* Cart Icon */}
          <Link to="/cart" className="relative text-gray-500">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-[10px] font-bold bg-red-600 text-white border-2 border-white">
                {totalItems}
              </Badge>
            )}
          </Link>

          <Sheet>
            <SheetTrigger>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-75 sm:w-100">
              <div className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                      <Avatar className="h-10 w-10 bg-red-100">
                        <AvatarFallback className="text-red-700 font-semibold">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold text-gray-900">{user.profile?.full_name || 'User'}</p>
                        <p className="text-xs text-gray-500">{user.role === 'Admin' ? 'Administrator' : 'Customer'}</p>
                      </div>
                    </div>

                    {user.role === 'Admin' && (
                      <>
                        <div className="pt-2 border-t border-gray-200">
                          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Admin Panel</p>
                        </div>
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-red-600"
                        >
                          <LayoutDashboard className="h-5 w-5" /> Dashboard
                        </Link>
                        <Link
                          to="/admin/products"
                          className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-red-600"
                        >
                          <Package className="h-5 w-5" /> Products
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-red-600"
                        >
                          <ShoppingBag className="h-5 w-5" /> Orders
                        </Link>
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-red-600"
                        >
                          <Users className="h-5 w-5" /> Users
                        </Link>
                        <Link
                          to="/admin/reviews"
                          className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-red-600"
                        >
                          <Star className="h-5 w-5" /> Reviews
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 text-lg font-medium text-red-600 hover:text-red-700 text-left pt-2 border-t border-gray-200"
                    >
                      <LogOut className="h-5 w-5" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="pt-2 border-t border-gray-200">
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2 px-1">Account</p>
                    </div>
                    <Link to="/login" className="flex items-center gap-3 text-lg font-medium text-gray-700 hover:text-red-600">
                      Login
                    </Link>
                    <Link to="/register" className="flex items-center gap-3 text-lg font-medium text-red-600 hover:text-red-700">
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}