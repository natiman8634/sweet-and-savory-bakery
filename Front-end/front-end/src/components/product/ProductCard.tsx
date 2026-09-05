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
          : 'shadow-sm hover:shadow-xl'
      }`}
    >
      {/* Image */}
      <div
        className={`relative overflow-hidden ${
          isCompact ? 'h-48 bg-gray-100' : 'h-48 bg-amber-50'
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
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-gray-500 line-clamp-1">
                {product.category?.category_name || 'Bakery'}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-bold text-amber-600">
                {Number(product.price).toFixed(2)} birr
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">
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
            <CardTitle className="text-lg font-semibold line-clamp-1">
              {product.name}
            </CardTitle>
            <div className="flex items-center gap-2 text-sm text-amber-600">
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
            <p className="text-sm text-gray-600 line-clamp-2">
              {product.description || 'Freshly baked daily!'}
            </p>
          </CardContent>
          <CardFooter className="flex justify-between items-center border-t pt-4">
            <span className="text-2xl font-bold text-amber-800">
              {Number(product.price).toFixed(2)} birr
            </span>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-500 gap-2"
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
