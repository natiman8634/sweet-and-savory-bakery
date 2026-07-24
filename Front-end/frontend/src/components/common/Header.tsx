import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import type{ RootState } from '../../store';
import { logout } from '../../store/authSlice';
import { Button } from '../ui/button';
import { ShoppingCart, User, LogOut, Package, LayoutDashboard } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export default function Header() {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="bg-amber-50 border-b border-amber-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-bold text-amber-700 flex items-center gap-2">
          🍰 Sweet & Savory
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/products" className="text-gray-700 hover:text-amber-600">
            Products
          </Link>
          
          <Link to="/cart" className="text-gray-700 hover:text-amber-600 relative">
            <ShoppingCart className="w-5 h-5" />
          </Link>

          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger >
                <div className="flex items-center gap-2 cursor-pointer hover:bg-amber-100 px-3 py-2 rounded-lg transition-colors">
                  <User className="w-5 h-5" />
                  <span className="hidden sm:inline">{user?.full_name || 'User'}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/orders')}>
                  <Package className="w-4 h-4 mr-2" />
                  Orders
                </DropdownMenuItem>
                {user?.role?.role_name === 'Admin' && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/admin')}>
                      <LayoutDashboard className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex gap-2">
              <Link to="/login">
                <Button variant="outline" className="border-amber-300 text-amber-700">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button className="bg-amber-600 hover:bg-amber-700">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}