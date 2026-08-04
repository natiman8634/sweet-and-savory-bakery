import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Menu, ShoppingCart, Home, Package, LogOut, User, LayoutDashboard } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user initials for avatar
  const getInitials = () => {
    if (!user) return '?';
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
    <nav className="border-b bg-white/95 backdrop-blur supports-backdrop-blur:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 text-xl font-bold text-amber-800">
          <span className="text-2xl">🍰</span>
          Sweet & Savory
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-gray-700 hover:text-amber-700 transition-colors"
            >
              {link.label}
            </Link>
          ))}
          
          {/* Cart Icon */}
          <Link to="/cart" className="relative text-gray-700 hover:text-amber-700">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-amber-700">
              0
            </Badge>
          </Link>

          {/* Auth Section */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger >
                <button className="flex items-center gap-2 hover:opacity-80">
                  <Avatar className="h-8 w-8 bg-amber-100">
                    <AvatarFallback className="text-amber-800 text-sm font-medium">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium hidden lg:inline">
                    {user.profile.full_name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="mr-2 h-4 w-4" /> Profile
                </DropdownMenuItem>
                {user.role === 'Admin' && (
                  <DropdownMenuItem onClick={() => navigate('/admin/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm">Login</Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-amber-700 hover:bg-amber-800">Sign Up</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <Link to="/cart" className="relative text-gray-700">
            <ShoppingCart className="h-5 w-5" />
            <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-amber-700">
              0
            </Badge>
          </Link>
          <Sheet>
            <SheetTrigger >
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-75 sm:w-100px">
              <div className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className="flex items-center gap-2 text-lg font-medium hover:text-amber-700"
                  >
                    <link.icon className="h-5 w-5" /> {link.label}
                  </Link>
                ))}
                {user ? (
                  <>
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Avatar className="h-8 w-8 bg-amber-100">
                        <AvatarFallback className="text-amber-800">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{user.profile.full_name}</span>
                    </div>
                    {user.role === 'Admin' && (
                      <Link to="/admin/dashboard" className="flex items-center gap-2 text-lg font-medium hover:text-amber-700">
                        <LayoutDashboard className="h-5 w-5" /> Dashboard
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 text-lg font-medium text-red-600 hover:text-red-700"
                    >
                      <LogOut className="h-5 w-5" /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/login" className="text-lg font-medium hover:text-amber-700">
                      Login
                    </Link>
                    <Link to="/register" className="text-lg font-medium text-amber-700">
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