import { useQuery } from '@tanstack/react-query';
import { getProducts } from '../api/productApi';
import { useCart } from '../context/CartContext';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Star, ShoppingCart } from 'lucide-react';

export default function Products() {
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: getProducts,
  });

   const { addItem } = useCart();

  console.log('📦 Data from API:', data);

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 text-amber-800"> Our Fresh Baked Goods</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-80 bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Error State
  if (isError) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-500 text-xl">❌ Failed to load products</p>
        <p className="text-gray-600 mt-2">{error?.message || 'Please try again later.'}</p>
        <Button onClick={() => refetch()} className="mt-4 bg-amber-700 hover:bg-amber-800">
          Retry
        </Button>
      </div>
    );
  }

  // 3. ✅ CRITICAL FIX: Check if data is an array
  if (!Array.isArray(data)) {
    console.error('❌ Data is not an array:', data);
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-red-600">⚠️ Data Format Error</h2>
        <p className="text-gray-600 mt-2">The product list is not available. Please try again.</p>
        <Button onClick={() => refetch()} className="mt-4 bg-amber-700 hover:bg-amber-800">
          Retry
        </Button>
      </div>
    );
  }

  // 4. Empty State
  if (data.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-semibold text-gray-600"> No products available yet</h2>
        <p className="text-gray-500 mt-2">Check back soon for fresh baked goods!</p>
      </div>
    );
  }

  // 5. Success State
   return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-amber-800"> Our Fresh Baked Goods</h1>
        <Badge variant="outline" className="text-sm px-3 py-1">
          {data.length} items
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.map((product) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
            {/* Product Image */}
            <div className="relative h-48 bg-amber-50 overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl text-amber-200">🥖</div>
              )}
              <div className="absolute top-2 right-2">
                {product.stock_quantity > 0 ? (
                  <Badge className="bg-green-600 hover:bg-green-700">In Stock</Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>
            </div>

            <CardHeader>
              <CardTitle className="text-lg font-semibold line-clamp-1">{product.name}</CardTitle>
              <div className="flex items-center gap-2 text-sm text-amber-600">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-medium">{product.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-400">({product.reviewsCount || 0} reviews)</span>
              </div>
            </CardHeader>

            <CardContent className="grow">
              <p className="text-sm text-gray-600 line-clamp-2">{product.description || 'Freshly baked daily!'}</p>
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t pt-4">
              <span className="text-2xl font-bold text-amber-800">${Number(product.price).toFixed(2)}</span>
              <Button 
                size="sm" 
                className="bg-amber-700 hover:bg-amber-800 gap-2"
                disabled={product.stock_quantity === 0}
                onClick={() => addItem({
                  id: product.id,
                  name: product.name,
                  price: Number(product.price),
                  image_url: product.image_url,
                  stock_quantity: product.stock_quantity,
                })}
              >
                <ShoppingCart className="w-4 h-4" /> Add
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}