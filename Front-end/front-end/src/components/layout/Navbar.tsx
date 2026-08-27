import { Link, useNavigate } from 'react-router-dom';
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
import { Menu, ShoppingCart, Home, Package, LogOut, User, LayoutDashboard, ShoppingBag, Users, Star } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();

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
  ];

  return (
    <nav className="border-b border-gray-200 bg-white/95 backdrop-blur supports-backdrop-blur:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-blue-700">
          Sweet & Savory
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          
          {/* Cart Icon - Always visible, even for guests */}
          <Link to="/cart" className="relative text-gray-700 hover:text-blue-600">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 text-white border-2 border-white">
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
                  <Avatar className="h-8 w-8 bg-blue-100">
                    <AvatarFallback className="text-blue-700 text-sm font-medium">
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
                <Button variant="ghost" size="sm" className="text-gray-600 hover:text-blue-600">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-blue-600 text-white hover:bg-blue-700">
                  Sign Up
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          {/* Cart Icon - Always visible */}
          <Link to="/cart" className="relative text-gray-700">
            <ShoppingCart className="h-5 w-5" />
            {totalItems > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-blue-600 text-white border-2 border-white">
                {totalItems}
              </Badge>
            )}
          </Link>

          <Sheet>
            <SheetTrigger >
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-75 sm:w-100">
              <div className="flex flex-col gap-4 mt-8">
                {user ? (
                  <>
                    <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                      <Avatar className="h-8 w-8 bg-blue-100">
                        <AvatarFallback className="text-blue-700">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-gray-700">{user.profile?.full_name || 'User'}</span>
                    </div>
                    {user.role === 'Admin' && (
                      <>
                        <div className="pt-4 border-t border-gray-200">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Admin Panel</p>
                        </div>
                        <Link
                          to="/admin/dashboard"
                          className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                        >
                          <LayoutDashboard className="h-5 w-5" /> Dashboard
                        </Link>
                        <Link
                          to="/admin/products"
                          className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                        >
                          <Package className="h-5 w-5" /> Products
                        </Link>
                        <Link
                          to="/admin/orders"
                          className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                        >
                          <ShoppingBag className="h-5 w-5" /> Orders
                        </Link>
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                        >
                          <Users className="h-5 w-5" /> Users
                        </Link>
                        <Link
                          to="/admin/reviews"
                          className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600"
                        >
                          <Star className="h-5 w-5" /> Reviews
                        </Link>
                      </>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-lg font-medium text-red-600 hover:text-red-700 text-left"
                    >
                      <LogOut className="h-5 w-5" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Account</p>
                    </div>
                    <Link to="/login" className="flex items-center gap-2 text-lg font-medium text-gray-700 hover:text-blue-600">
                      Login
                    </Link>
                    <Link to="/register" className="flex items-center gap-2 text-lg font-medium text-blue-600 hover:text-blue-700">
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