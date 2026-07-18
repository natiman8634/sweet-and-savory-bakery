import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

// Extend Request type for authenticated requests
interface AuthRequest extends Request {
  user?: {
    userId: string;
    roleId: number;
    email?: string;
    role?: {
      id: number;
      role_name: string;
    };
  };
}

// Helper functions for safe parameter parsing
const getStringParam = (param: any): string => {
  if (typeof param === 'string') return param;
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') return param[0];
  return '';
};

const getNumberParam = (param: any): number => {
  const str = getStringParam(param);
  const num = Number(str);
  return isNaN(num) ? 1 : Math.max(1, num);
};

// ============================================================
// 🟢 TASK 2: PRODUCT REVIEW & RATING SYSTEM
// ============================================================

/**
 * Create a review for a product (Authenticated users only)
 * POST /api/products/:id/reviews
 */
export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id: productId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const { rating, comment } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be between 1 and 5'
      });
    }

    // Validate comment
    if (!comment || comment.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: 'Comment must be at least 3 characters'
      });
    }

    if (comment.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters'
      });
    }

    const productIdStr = getStringParam(productId);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productIdStr }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get user's profile ID for order check
    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: userId }
    });

    // Check if user has purchased this product
    let hasPurchased = false;
    if (profile) {
      const orderItem = await prisma.orderItems.findFirst({
        where: {
          product_id: productIdStr,
          order: {
            customer_id: profile.id,
            status: {
              status_name: {
                notIn: ['Cancelled', 'Unpaid']
              }
            }
          }
        }
      });
      hasPurchased = !!orderItem;
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReviews.findUnique({
      where: {
        product_id_user_id: {
          product_id: productIdStr,
          user_id: userId
        }
      }
    });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product'
      });
    }

    // Create review using Prisma Client
    const review = await prisma.productReviews.create({
      data: {
        product_id: productIdStr,
        user_id: userId,
        rating,
        comment: comment.trim(),
        is_verified_purchase: hasPurchased
      },
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: {
                full_name: true
              }
            }
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            image_url: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: {
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        is_verified_purchase: review.is_verified_purchase,
        customer_name: review.user?.profile?.full_name || 'Anonymous',
        product_name: review.product?.name,
        created_at: review.created_at,
        updated_at: review.updated_at
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create review',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get reviews for a product (Public)
 * GET /api/products/:id/reviews
 */
export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { id: productId } = req.params;
    const page = getNumberParam(req.query.page);
    const limit = Math.min(50, getNumberParam(req.query.limit));
    const offset = (page - 1) * limit;

    const productIdStr = getStringParam(productId);

    // Check if product exists
    const product = await prisma.products.findUnique({
      where: { id: productIdStr },
      select: {
        id: true,
        name: true,
        price: true,
        image_url: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Get reviews with pagination using Prisma Client
    const [reviews, total] = await Promise.all([
      prisma.productReviews.findMany({
        where: { product_id: productIdStr },
        include: {
          user: {
            select: {
              profile: {
                select: {
                  full_name: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.productReviews.count({
        where: { product_id: productIdStr }
      })
    ]);

    // Calculate average rating
    const ratingStats = await prisma.productReviews.aggregate({
      where: { product_id: productIdStr },
      _avg: {
        rating: true
      },
      _count: true
    });

    // Get rating distribution
    const distribution = await prisma.productReviews.groupBy({
      by: ['rating'],
      where: { product_id: productIdStr },
      _count: true
    });

    const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(item => {
      distributionMap[item.rating] = item._count;
    });

    const totalPages = Math.ceil(total / limit);

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      is_verified_purchase: review.is_verified_purchase,
      customer_name: review.user?.profile?.full_name || 'Anonymous',
      created_at: review.created_at,
      updated_at: review.updated_at
    }));

    res.json({
      success: true,
      data: {
        product: {
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image_url: product.image_url
        },
        reviews: formattedReviews,
        ratingStats: {
          average: Number(ratingStats._avg.rating) || 0,
          total: ratingStats._count || 0,
          distribution: distributionMap
        },
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get all reviews by the authenticated user
 * GET /api/reviews/my-reviews
 */
export const getMyReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const page = getNumberParam(req.query.page);
    const limit = Math.min(50, getNumberParam(req.query.limit));
    const offset = (page - 1) * limit;

    // Get user's reviews using Prisma Client
    const [reviews, total] = await Promise.all([
      prisma.productReviews.findMany({
        where: { user_id: userId },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              image_url: true,
              price: true
            }
          },
          user: {
            select: {
              profile: {
                select: {
                  full_name: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        },
        take: limit,
        skip: offset
      }),
      prisma.productReviews.count({
        where: { user_id: userId }
      })
    ]);

    const totalPages = Math.ceil(total / limit);

    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      is_verified_purchase: review.is_verified_purchase,
      product: {
        id: review.product.id,
        name: review.product.name,
        price: Number(review.product.price),
        image_url: review.product.image_url
      },
      customer_name: review.user?.profile?.full_name || 'Anonymous',
      created_at: review.created_at,
      updated_at: review.updated_at
    }));

    res.json({
      success: true,
      data: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: total,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error('Error fetching my reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your reviews',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Delete a review (Only author or admin)
 * DELETE /api/reviews/:id
 */
export const deleteReview = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;
    const isAdmin = req.user?.role?.role_name === 'Admin';

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const reviewId = getStringParam(id);

    // Get review with product info
    const review = await prisma.productReviews.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    // Check if user is authorized to delete
    if (!isAdmin && review.user_id !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this review'
      });
    }

    // Delete review using Prisma Client
    await prisma.productReviews.delete({
      where: { id: reviewId }
    });

    res.json({
      success: true,
      message: `Review for "${review.product?.name || 'product'}" deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Helper: Get product rating stats
 */
export const getProductRatingStats = async (productId: string) => {
  try {
    const productIdStr = getStringParam(productId);

    const stats = await prisma.productReviews.aggregate({
      where: { product_id: productIdStr },
      _avg: {
        rating: true
      },
      _count: true
    });

    // Get distribution
    const distribution = await prisma.productReviews.groupBy({
      by: ['rating'],
      where: { product_id: productIdStr },
      _count: true
    });

    const distributionMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    distribution.forEach(item => {
      distributionMap[item.rating] = item._count;
    });

    return {
      averageRating: Number(stats._avg.rating) || 0,
      reviewsCount: stats._count || 0,
      distribution: distributionMap
    };
  } catch (error) {
    console.error('Error getting product rating stats:', error);
    return {
      averageRating: 0,
      reviewsCount: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }
};