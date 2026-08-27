import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
import { Card, CardContent } from '../components/ui/card';
import { 
  User, 
  MapPin, 
  CreditCard, 
  ClipboardList, 
  Gift, 
  Settings, 
  HelpCircle, 
  Info,
  LogOut 
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Get user initials
  const getInitials = () => {
    if (!user) return '?';
    return user.profile.full_name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Profile menu items
  const menuItems = [
    { icon: User, label: 'Informations personnelles', to: '/profile/personal' },
    { icon: MapPin, label: 'Adresses enregistrées', to: '/profile/addresses' },
    { icon: CreditCard, label: 'Moyens de paiement', to: '/profile/payments' },
    { icon: ClipboardList, label: 'Historique des commandes', to: '/orders' },
    { icon: Gift, label: 'Codes promo', to: '/profile/promos' },
    { icon: Settings, label: 'Paramètres', to: '/profile/settings' },
    { icon: HelpCircle, label: 'Aide et support', to: '/profile/help' },
    { icon: Info, label: 'À propos de l\'application', to: '/profile/about' },
  ];

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-gray-600">Please log in to view your profile.</p>
        <Button onClick={() => navigate('/login')} className="mt-4 bg-amber-700 hover:bg-amber-800">
          Login
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-4 max-w-md">
      {/* Profile Header */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 bg-amber-100">
              <AvatarFallback className="text-amber-800 text-xl font-medium">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{user.profile.full_name}</h2>
              <p className="text-sm text-gray-500">{user.email}</p>
              <p className="text-xs text-amber-600 mt-0.5">
                {user.role === 'Admin' ? '🛡️ Administrateur' : '👤 Client'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.to)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-left"
          >
            <item.icon className="h-5 w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center gap-3 px-4 py-3 mt-4 rounded-lg hover:bg-red-50 transition-colors text-left text-red-600"
      >
        <LogOut className="h-5 w-5" />
        <span className="text-sm font-medium">Se déconnecter</span>
      </button>
    </div>
  );
}