import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/productApi';
import { getCategories } from '../api/productApi';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Pizza,
  Beef,
  Cake,
  Fish,
  Coffee,
  Salad,
  Clock,
  Search,
  ArrowRight,
  Flame,
  Truck,
  CreditCard,
  Headphones,
  Store,
  Sandwich,
  IceCream,
  Martini,
  Cookie,
  EggFried,
  Apple,
  Croissant,
} from 'lucide-react';
import image from "./download__20_-removebg-preview.png";

// ============================================================
// 🎨 CATEGORY ICON MAP
// ============================================================

const categoryIcons: Record<string, any> = {
  Breads: Croissant,
  Pastries: Cake,
  Cakes: Cake,
  Pizza: Pizza,
  Burgers: Beef,
  Desserts: IceCream,
  Sushi: Fish,
  Drinks: Martini,
  Salads: Salad,
  Coffee: Coffee,
  Sandwiches: Sandwich,
  Cookies: Cookie,
  Breakfast: EggFried,
  Healthy: Apple,
};

const categoryColors: Record<string, string> = {
  Breads: 'from-amber-500/10 to-amber-500/5 border-amber-200',
  Pastries: 'from-pink-500/10 to-pink-500/5 border-pink-200',
  Cakes: 'from-rose-500/10 to-rose-500/5 border-rose-200',
  Pizza: 'from-red-500/10 to-red-500/5 border-red-200',
  Burgers: 'from-orange-500/10 to-orange-500/5 border-orange-200',
  Desserts: 'from-purple-500/10 to-purple-500/5 border-purple-200',
  Sushi: 'from-emerald-500/10 to-emerald-500/5 border-emerald-200',
  Drinks: 'from-blue-500/10 to-blue-500/5 border-blue-200',
  Salads: 'from-green-500/10 to-green-500/5 border-green-200',
  Coffee: 'from-amber-600/10 to-amber-600/5 border-amber-200',
};

// ============================================================
// 🏠 MAIN HOME COMPONENT
// ============================================================

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  });

  const products = productsData || [];
  const categories = categoriesData || [];
  const popularProducts = products.slice(0, 4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-screen bg-white-500">
      
      {/* ============================================================
          HERO SECTION
          ============================================================ */}
      <section className="relative bg-red-500 overflow-hidden py-8 sm:py-12 md:py-20">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-100/50 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-orange-100/50 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 bg-amber-50/50 rounded-full -translate-x-1/2 -translate-y-1/2 blur-2xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
            {/* LEFT CONTENT */}
            <div className="text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 tracking-tight text-slate-800">
                Delicious <span className="text-amber-400">Baked Goods</span>
                <br />
                Delivered Fast
              </h1>

              {/* Search Bar */}
              <form onSubmit={handleSearch} className="max-w-xl mx-auto lg:mx-0 flex gap-1.5 sm:gap-2 bg-white rounded-lg sm:rounded-xl p-1 sm:p-1.5 shadow-lg border border-slate-200">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for bread, cakes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 sm:pl-10 h-9 sm:h-12 border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm sm:text-base text-gray-800 placeholder:text-gray-400"
                  />
                </div>
                <Button type="submit" className="h-9 sm:h-12 px-3 sm:px-6 bg-red-500 hover:bg-red-600 text-white font-semibold text-sm sm:text-base">
                  Search <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </form>

              {/* Delivery Stats */}
              <div className="flex flex-nowrap justify-center lg:justify-start gap-3 sm:gap-4 md:gap-6 lg:gap-10 mt-8 text-xs sm:text-sm text-gray-600">
                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                  <span>Free Delivery</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                  <span>30-40 min</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                  <span>Secure Payment</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 whitespace-nowrap">
                  <Headphones className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500 shrink-0" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>

            {/* RIGHT CONTENT – STATIC VERTICAL IMAGE (no border, no shadow) */}
            <div className="relative flex justify-center">
              <div className="relative w-full max-w-50 sm:max-w-xs md:max-w-md lg:max-w-lg">
                <img
                  src={image}
                  alt="Fresh Pastries"
                  className="w-full h-auto object-contain max-h-62.5 sm:max-h-87.5 md:max-h-112.5 lg:max-h-137.5"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          CATEGORIES SECTION
          ============================================================ */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Categories</h2>
              <p className="text-sm text-gray-500">Browse by category</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {categoriesLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map((category: any) => {
                const Icon = categoryIcons[category.category_name] || Store;
                const colorClass = categoryColors[category.category_name] || 'from-gray-500/10 to-gray-500/5 border-gray-200';

                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="group"
                  >
                    <Card className={`border-0 shadow-sm hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 bg-linear-to-br ${colorClass}`}>
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 mx-auto rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                          <Icon className="h-6 w-6 text-slate-700" />
                        </div>
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {category.category_name}
                        </p>
                        <p className="text-xs text-gray-400">{category.product_count || 0} items</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          POPULAR PRODUCTS SECTION
          ============================================================ */}
      <section className="py-12 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800">🔥 Popular Items</h2>
              <p className="text-sm text-gray-500">Most loved by our customers</p>
            </div>
            <Link to="/products">
              <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {productsLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {popularProducts.map((product: any) => (
                <Link to={`/products/${product.id}`} key={product.id}>
                  <Card className="group overflow-hidden border-0 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
                          🍞
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-600 text-white border-0">
                        <Flame className="h-3 w-3 mr-1" /> Popular
                      </Badge>
                      <Badge className="absolute bottom-3 left-3 bg-white/90 text-slate-700 border-0 backdrop-blur-sm">
                        ⭐ {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0})
                      </Badge>
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {product.name}
                          </h3>
                          <p className="text-sm text-gray-500 line-clamp-1">
                            {product.category?.category_name || 'Bakery'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-amber-600">${Number(product.price).toFixed(2)}</p>
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">
                            {product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ============================================================
          HOT DEAL SECTION
          ============================================================ */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="relative overflow-hidden rounded-2xl bg-linear-to-r from-red-500 to-orange-500 text-white p-8 md:p-12">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/3" />
            </div>

            <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <Badge className="mb-3 bg-white/20 text-white border-0 hover:bg-white/30 backdrop-blur-sm px-4 py-1.5 text-sm">
                  🔥 Hot Deal
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold">30% OFF</h2>
                <p className="text-amber-100 text-lg mt-1">on all orders over $25</p>
                <p className="text-amber-50/80 text-sm mt-2">Use code: <span className="font-mono font-bold">SWEET30</span></p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link to="/products">
                  <Button className="bg-white text-amber-600 hover:bg-orange-50 font-semibold px-8 py-6 text-lg">
                    Order Now <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button variant="outline" className="border-white/30 text-amber-600 hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================================================
          FEATURES SECTION
          ============================================================ */}
      <section className="py-12 bg-slate-50/50 border-t border-slate-200">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-3 bg-blue-50 rounded-full">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Free Delivery</p>
                <p className="text-sm text-gray-500">On orders over $20</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-3 bg-emerald-50 rounded-full">
                <Flame className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Fresh Baked Daily</p>
                <p className="text-sm text-gray-500">Made with love</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-3 bg-purple-50 rounded-full">
                <CreditCard className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">Secure Payment</p>
                <p className="text-sm text-gray-500">Multiple payment methods</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
              <div className="p-3 bg-amber-50 rounded-full">
                <Headphones className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">24/7 Support</p>
                <p className="text-sm text-gray-500">We're here to help</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}