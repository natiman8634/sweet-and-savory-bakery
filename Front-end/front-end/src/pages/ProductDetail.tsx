import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getProductById } from '../api/productApi';
import { getProductReviews, type Review, type ReviewStats } from '../api/reviewApi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import {
  Star,
  ShoppingCart,
  ArrowLeft,
  Clock,
  Package,
  ChevronRight,
  Croissant,
  CheckCircle,
  Minus,
  Plus,
} from 'lucide-react';
import { useState } from 'react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);

  const {
    data: product,
    isLoading: productLoading,
    isError: productError,
  } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id!),
    enabled: !!id,
  });

  const {
    data: reviewsData,
    isLoading: reviewsLoading,
  } = useQuery({
    queryKey: ['productReviews', id],
    queryFn: () => getProductReviews(id!, 1, 10),
    enabled: !!id,
  });

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-96 bg-gray-200 rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 w-3/4 bg-gray-200 rounded" />
              <div className="h-4 w-1/2 bg-gray-200 rounded" />
              <div className="h-10 w-1/3 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <p className="text-red-500 text-xl">Failed to load product</p>
        <Link to="/products">
          <Button className="mt-4 bg-amber-700 hover:bg-amber-800">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products
          </Button>
        </Link>
      </div>
    );
  }

  const reviews: Review[] = reviewsData?.data?.reviews || [];
  const stats: ReviewStats | undefined = reviewsData?.data?.ratingStats;
  const inStock = product.stock_quantity > 0;

  const handleAddToCart = () => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image_url: product.image_url,
        stock_quantity: product.stock_quantity,
      },
      quantity,
    );
    setQuantity(1);
  };

  const renderStars = (rating: number, size = 'h-4 w-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < Math.floor(rating)
            ? 'fill-amber-400 text-amber-400'
            : i < rating
            ? 'fill-amber-400/50 text-amber-400/50'
            : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="container mx-auto px-4 py-6 md:py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link to="/" className="hover:text-amber-700 transition-colors">Home</Link>
        <ChevronRight className="h-3 w-3" />
        <Link to="/products" className="hover:text-amber-700 transition-colors">Products</Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-gray-800 font-medium truncate">{product.name}</span>
      </nav>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Image */}
        <div className="relative bg-amber-50 rounded-2xl overflow-hidden">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-80 md:h-[480px] object-cover"
            />
          ) : (
            <div className="w-full h-80 md:h-[480px] flex items-center justify-center text-amber-200">
              <Croissant className="h-24 w-24" />
            </div>
          )}
          {!inStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg px-6 py-2">Out of Stock</Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-5">
          {/* Category */}
          {product.category && (
            <Badge variant="outline" className="w-fit text-amber-700 border-amber-300">
              {product.category.category_name}
            </Badge>
          )}

          {/* Name */}
          <h1 className="text-3xl md:text-4xl font-bold text-slate-800">{product.name}</h1>

          {/* Rating */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {renderStars(stats?.average || product.averageRating || 0)}
            </div>
            <span className="text-sm text-gray-500">
              {(stats?.average || product.averageRating || 0).toFixed(1)} ({stats?.total || product.reviewsCount || 0} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-amber-700">${Number(product.price).toFixed(2)}</span>
            {inStock && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">
                <CheckCircle className="h-3 w-3 mr-1" /> In Stock
              </Badge>
            )}
          </div>

          {/* Description */}
          <p className="text-gray-600 leading-relaxed">
            {product.description || 'Freshly baked daily with the finest ingredients.'}
          </p>

          {/* Stock info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Package className="h-4 w-4" />
            <span>{product.stock_quantity} available</span>
          </div>

          {/* Quantity + Add to Cart */}
          {inStock && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 font-semibold text-slate-800 min-w-[48px] text-center">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                  className="px-3 py-2 hover:bg-gray-100 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <Button
                size="lg"
                className="flex-1 bg-amber-700 hover:bg-amber-800 gap-2"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="h-5 w-5" /> Add to Cart
              </Button>
            </div>
          )}

          {!inStock && (
            <Button size="lg" disabled className="mt-2">
              Out of Stock
            </Button>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <section>
        <h2 className="text-2xl font-bold text-slate-800 mb-6">Customer Reviews</h2>

        {/* Rating Summary */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 mb-8">
            <div className="flex flex-col items-center justify-center p-6 bg-amber-50 rounded-xl">
              <span className="text-5xl font-bold text-amber-700">{stats.average.toFixed(1)}</span>
              <div className="flex items-center gap-1 mt-2">{renderStars(stats.average, 'h-5 w-5')}</div>
              <span className="text-sm text-gray-500 mt-1">{stats.total} reviews</span>
            </div>
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const count = stats.distribution[star as keyof typeof stats.distribution] || 0;
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
                return (
                  <div key={star} className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 w-12">{star} star</span>
                    <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-sm text-gray-500 w-8 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Review List */}
        {reviewsLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <Card className="border-0 shadow-sm">
            <CardContent className="p-8 text-center text-gray-500">
              <Clock className="h-10 w-10 mx-auto mb-3 text-gray-300" />
              <p>No reviews yet. Be the first to review this product!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <Card key={review.id} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800">
                        {review.user?.profile?.full_name || 'Anonymous'}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-0.5">
                          {renderStars(review.rating)}
                        </div>
                        {review.is_verified_purchase && (
                          <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-600">
                            Verified Purchase
                          </Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(review.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">{review.comment}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
