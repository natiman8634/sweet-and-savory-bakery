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
  Sandwich,
  IceCream,
  Martini,
  Cookie,
  EggFried,
  Apple,
  Croissant,
  Star,
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
      <section className="py-12 sm:py-16 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          {/* Section Title */}
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-red-500">Categories</h2>
            <div className="flex items-center justify-center gap-1.5 mt-2">
              <div className="w-8 h-0.5 bg-red-300 rounded-full" />
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <div className="w-2 h-2 bg-red-400 rounded-full" />
              <div className="w-8 h-0.5 bg-red-300 rounded-full" />
            </div>
          </div>

          {categoriesLoading ? (
            <div className="flex gap-6 justify-center overflow-hidden px-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-40 h-48 bg-gray-200 rounded-3xl animate-pulse shrink-0"></div>
              ))}
            </div>
          ) : (
            <div className="flex gap-4 sm:gap-6 justify-center flex-wrap px-4">
              {categories.slice(0, 6).map((category: any) => {
                const bgColors: Record<string, string> = {
                  Breads: '#fde68a',
                  Pastries: '#fecdd3',
                  Cakes: '#fce7f3',
                  Pizza: '#fed7aa',
                  Burgers: '#d9f99d',
                  Desserts: '#e9d5ff',
                  Sushi: '#bbf7d0',
                  Drinks: '#bfdbfe',
                  Salads: '#a7f3d0',
                  Coffee: '#fde68a',
                  Sandwiches: '#fed7aa',
                  Cookies: '#fef3c7',
                  Breakfast: '#fef9c3',
                  Healthy: '#bbf7d0',
                };
                const categoryImages: Record<string, string> = {
                  Breads: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop',
                  Pastries: 'https://i.pinimg.com/1200x/4f/61/58/4f6158f5f1fa889389645e749feede74.jpg',
                  Cakes: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=400&h=400&fit=crop',
                  Pizza: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=400&fit=crop',
                  Burgers: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
                  Desserts: 'https://images.unsplash.com/photo-1551024601-bec78aea704b?w=400&h=400&fit=crop',
                  Sushi: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&h=400&fit=crop',
                  Drinks: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=400&h=400&fit=crop',
                  Salads: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=400&fit=crop',
                  Coffee: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&h=400&fit=crop',
                  Sandwiches: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop',
                  Cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=400&h=400&fit=crop',
                  Breakfast: 'https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=400&h=400&fit=crop',
                  Healthy: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=400&h=400&fit=crop',
                };
                const bgColor = bgColors[category.category_name] || '#e5e7eb';
                const imageUrl = categoryImages[category.category_name] || 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&h=400&fit=crop';
                const CategoryIcon = categoryIcons[category.category_name] || Cake;

                return (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.id}`}
                    className="group"
                  >
                    <div className="relative flex flex-col items-center">
                      {/* Image overlapping from top */}
                      <div className="relative z-10 w-28 h-28 sm:w-32 sm:h-32 -mb-6">
                        <img
                          src={imageUrl}
                          alt={category.category_name}
                          className="w-full h-full object-cover rounded-full border-4 border-white shadow-lg group-hover:scale-110 transition-transform duration-300"
                        />
                      </div>
                      {/* Colored pill card */}
                      <div
                        className="relative w-36 sm:w-44 h-14 sm:h-16 rounded-full flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-300"
                        style={{ backgroundColor: bgColor }}
                      >
                        <CategoryIcon className="mr-2 h-5 w-5 text-slate-600" aria-hidden="true" />
                        <span className="font-bold text-sm sm:text-base text-slate-700 group-hover:text-slate-900 transition-colors">
                          {category.category_name}
                        </span>
                      </div>
                      {/* Hover overlay */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                        <span className="bg-white text-red-500 text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                          Click Now
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/products">
              <Button className="bg-red-500 hover:bg-red-600 text-white px-8">
                View All Categories <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ============================================================
          POPULAR PRODUCTS SECTION
          ============================================================ */}
      <section className="py-12 bg-slate-50/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><Flame className="h-5 w-5 text-red-500" /> Popular Items</h2>
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
                          <Croissant className="h-12 w-12" />
                        </div>
                      )}
                      <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-600 text-white border-0">
                        <Flame className="h-3 w-3 mr-1" /> Popular
                      </Badge>
                      <Badge className="absolute bottom-3 left-3 bg-white/90 text-slate-700 border-0 backdrop-blur-sm">
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" /> {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0})
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
                  <Flame className="h-4 w-4 inline mr-1" /> Hot Deal
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