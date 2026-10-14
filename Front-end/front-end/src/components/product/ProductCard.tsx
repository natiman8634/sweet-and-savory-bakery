import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Star, ShoppingCart, Flame, Croissant } from 'lucide-react';
import type { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  /** 'compact' = Home page style (smaller, link wrapper, popular badge)
   *  'full'   = Products page style (larger, description, add-to-cart button) */
  variant?: 'compact' | 'full';
  /** Show a "Popular" badge (Home page) */
  showPopularBadge?: boolean;
  /** Callback when "Add to Cart" is clicked (Products page) */
  onAddToCart?: (product: Product) => void;
}

export default function ProductCard({
  product,
  variant = 'compact',
  showPopularBadge = false,
  onAddToCart,
}: ProductCardProps) {
  const isCompact = variant === 'compact';

  const card = (
    <Card
      className={`overflow-hidden border-0 transition-all duration-300 flex flex-col ${
        isCompact
          ? 'shadow-sm hover:shadow-lg hover:-translate-y-1 group'
          : 'shadow-sm hover:shadow-xl [--card-spacing:0.75rem] sm:[--card-spacing:1rem]'
      }`}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${
          isCompact ? 'h-36 sm:h-48 bg-gray-100' : 'h-36 sm:h-48 bg-amber-50'
        }`}
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-gray-300">
            <Croissant className="h-12 w-12" />
          </div>
        )}

        {/* Popular badge (Home page) */}
        {showPopularBadge && (
          <Badge className="absolute top-3 left-3 bg-amber-500 hover:bg-amber-600 text-white border-0">
            <Flame className="h-3 w-3 mr-1" /> Popular
          </Badge>
        )}

        {/* Rating badge on image (compact) */}
        {isCompact && (
          <Badge className="absolute bottom-3 left-3 bg-white/90 text-slate-700 border-0 backdrop-blur-sm">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400 inline" />{' '}
            {product.averageRating?.toFixed(1) || '0.0'} ({product.reviewsCount || 0})
          </Badge>
        )}

        {/* Stock badge */}
        <div className="absolute top-2 right-2">
          {product.stock_quantity > 0 ? (
            <Badge className="bg-green-600 hover:bg-green-700">{product.stock_quantity} in stock</Badge>
          ) : (
            <Badge variant="destructive">Out of Stock</Badge>
          )}
        </div>
      </div>

      {/* Content */}
      {isCompact ? (
        <CardContent className="p-3 sm:p-4 flex flex-col gap-2 sm:gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-2">
            <div className="min-w-0 sm:flex-1">
              <h3 className="font-semibold text-sm sm:text-base text-slate-800 group-hover:text-blue-600 transition-colors line-clamp-1">
                {product.name}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 line-clamp-1">
                {product.category?.category_name || 'Bakery'}
              </p>
            </div>
            <div className="flex items-baseline justify-between gap-2 sm:block sm:shrink-0 sm:text-right">
              <p className="font-bold text-sm sm:text-base text-amber-600 whitespace-nowrap">
                {Number(product.price).toFixed(2)} birr
              </p>
              <p className="text-[10px] sm:text-[11px] text-gray-400 whitespace-nowrap sm:mt-0.5">
                {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of stock'}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            className="w-full bg-red-600 hover:bg-red-500 gap-2"
            disabled={product.stock_quantity === 0}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onAddToCart?.(product);
            }}
          >
            <ShoppingCart className="w-4 h-4" /> Add to Cart
          </Button>
        </CardContent>
      ) : (
        <>
          <CardHeader>
            <CardTitle className="text-sm sm:text-lg font-semibold line-clamp-1">
              {product.name}
            </CardTitle>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs sm:text-sm text-amber-600">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="font-medium">
                {product.averageRating?.toFixed(1) || '0.0'}
              </span>
              <span className="text-gray-400">
                ({product.reviewsCount || 0} reviews)
              </span>
            </div>
          </CardHeader>
          <CardContent className="grow">
            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
              {product.description || 'Freshly baked daily!'}
            </p>
          </CardContent>
          <CardFooter className="flex flex-col items-stretch gap-2 border-t pt-3 sm:flex-row sm:items-center sm:justify-between sm:pt-4">
            <span className="text-lg sm:text-2xl font-bold text-amber-800">
              {Number(product.price).toFixed(2)} birr
            </span>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-500 gap-2 w-full sm:w-auto"
              disabled={product.stock_quantity === 0}
              onClick={() => onAddToCart?.(product)}
            >
              <ShoppingCart className="w-4 h-4" /> Add to Cart
            </Button>
          </CardFooter>
        </>
      )}
    </Card>
  );

  // Compact variant wraps the entire card in a link
  if (isCompact) {
    return (
      <Link to={`/products/${product.id}`} className="block">
        {card}
      </Link>
    );
  }

  return card;
}
