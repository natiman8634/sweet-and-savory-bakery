import { apiClient } from './client';

// ============================================================
// 📝 REVIEW TYPES
// ============================================================

export interface Review {
  id: string;
  rating: number;
  comment: string;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    profile?: {
      full_name: string;
    };
  };
  product?: {
    id: string;
    name: string;
    image_url: string;
    price: number;
  };
}

export interface ReviewStats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

export interface ProductReviewsResponse {
  success: boolean;
  data: {
    product: {
      id: string;
      name: string;
      price: number;
      image_url: string;
    };
    reviews: Review[];
    ratingStats: ReviewStats;
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
  };
}

// ============================================================
// 🟢 PUBLIC ENDPOINTS
// ============================================================

// ✅ GET /api/products/:id/reviews
export const getProductReviews = async (
  productId: string,
  page: number = 1,
  limit: number = 10
): Promise<ProductReviewsResponse> => {
  const response = await apiClient.get(`/products/${productId}/reviews`, {
    params: { page, limit },
  });
  return response.data;
};

// ============================================================
// 🔐 AUTHENTICATED ENDPOINTS
// ============================================================

// ✅ POST /api/products/:id/reviews
export const createReview = async (
  productId: string,
  data: { rating: number; comment: string }
): Promise<{ success: boolean; data: Review }> => {
  const response = await apiClient.post(`/products/${productId}/reviews`, data);
  return response.data;
};

// ✅ GET /api/reviews/my-reviews
export const getMyReviews = async (page: number = 1, limit: number = 10): Promise<{
  success: boolean;
  data: Review[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}> => {
  const response = await apiClient.get('/reviews/my-reviews', {
    params: { page, limit },
  });
  return response.data;
};

// ✅ DELETE /api/reviews/:id
export const deleteReview = async (reviewId: string): Promise<{ success: boolean; message: string }> => {
  const response = await apiClient.delete(`/reviews/${reviewId}`);
  return response.data;
};

// ============================================================
// 📊 REVIEW STATS HELPER
// ============================================================

export const getRatingStats = (reviews: Review[]): ReviewStats => {
  const total = reviews.length;
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
  const average = total > 0 ? sum / total : 0;

  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  reviews.forEach((r) => {
    if (r.rating >= 1 && r.rating <= 5) {
      distribution[r.rating as keyof typeof distribution] = (distribution[r.rating as keyof typeof distribution] || 0) + 1;
    }
  });

  return {
    average,
    total,
    distribution,
  };
};