import { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { productsApi, type Product } from '../api/products.api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { ShoppingCart, Star } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { addItem } from '../store/cartSlice';
import { toast } from 'sonner';

// Fallback image - use a data URI or local image
const FALLBACK_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="200" viewBox="0 0 300 200"%3E%3Crect width="300" height="200" fill="%23f3f4f6"/%3E%3Ctext x="150" y="100" font-family="Arial" font-size="16" fill="%239ca3af" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchParams] = useSearchParams();
  const category = searchParams.get('category');
  const dispatch = useDispatch();
  
  // ✅ Use ref to track if data is already loaded
  const dataLoadedRef = useRef(false);
  const fetchPromiseRef = useRef<Promise<void> | null>(null);

  useEffect(() => {
    // ✅ Only fetch if we don't have data or category changed
    if (!dataLoadedRef.current || category) {
      fetchProducts();
    }
  }, [category]);

  const fetchProducts = async () => {
    // ✅ Prevent concurrent fetches
    if (fetchPromiseRef.current) {
      return fetchPromiseRef.current;
    }

    // ✅ Don't fetch if we already have data and no category filter changed
    if (dataLoadedRef.current && products.length > 0 && !category) {
      setLoading(false);
      return;
    }

    const promise = (async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await productsApi.getAll({ category: category || undefined });
        
        const productsData = Array.isArray(response.data) ? response.data : [];
        
        if (productsData.length > 0) {
          setProducts(productsData);
          dataLoadedRef.current = true;
        } else {
          // If empty, check if we have cached products
          if (products.length === 0) {
            setProducts([]);
          }
        }
      } catch (error: any) {
        console.error('Error fetching products:', error);
        setError(error?.message || 'Failed to load products');
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
        fetchPromiseRef.current = null;
      }
    })();

    fetchPromiseRef.current = promise;
    return promise;
  };

  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    dispatch(addItem({
      id: product.id,
      product_id: product.id,
      name: product.name,
      price: Number(product.price),
      quantity: 1,
      image_url: product.image_url,
      stock_quantity: product.stock_quantity,
    }));
    toast.success(`Added ${product.name} to cart`);
  };

  // Handle image error with fallback
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src = FALLBACK_IMAGE;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-red-600">Error loading products</h2>
        <p className="text-gray-500 mt-2">{error}</p>
        <Button 
          className="mt-4 bg-amber-600 hover:bg-amber-700"
          onClick={() => {
            dataLoadedRef.current = false;
            fetchProducts();
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  if (!Array.isArray(products) || products.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-600">No products found</h2>
        <p className="text-gray-500 mt-2">Check back later for fresh baked goods!</p>
        <Button 
          className="mt-4 bg-amber-600 hover:bg-amber-700"
          onClick={() => {
            dataLoadedRef.current = false;
            fetchProducts();
          }}
        >
          Refresh
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {category ? `${category} Products` : 'Our Products'}
      </h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => {
          const reviewCount = product._count?.reviews || 0;
          
          return (
            <Card key={product.id} className="flex flex-col hover:shadow-lg transition-shadow">
              <Link to={`/products/${product.id}`}>
                <img
                  src={product.image_url || FALLBACK_IMAGE}
                  alt={product.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                  onError={handleImageError}
                />
              </Link>
              <CardHeader className="grow">
                <Link to={`/products/${product.id}`}>
                  <CardTitle className="text-lg hover:text-amber-600 transition-colors">
                    {product.name}
                  </CardTitle>
                </Link>
                <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-amber-700">
                    ${Number(product.price).toFixed(2)}
                  </span>
                  {reviewCount > 0 && (
                    <span className="flex items-center text-sm text-gray-600">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 mr-1" />
                      {reviewCount}
                    </span>
                  )}
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-700"
                  onClick={() => handleAddToCart(product)}
                  disabled={!product.is_available || product.stock_quantity <= 0}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  {!product.is_available ? 'Unavailable' : 
                   product.stock_quantity <= 0 ? 'Out of Stock' : 
                   'Add to Cart'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}