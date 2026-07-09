import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';  // ✅ Changed from .ts to .js (consistent with orders.ts)

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

// ✅ NEW: Helper function to safely get string from query params (moved from inline)
const getStringParam = (param: any): string | undefined => {
  if (typeof param === 'string') {
    return param;
  }
  if (Array.isArray(param) && param.length > 0 && typeof param[0] === 'string') {
    return param[0];
  }
  return undefined;
};

// ✅ NEW: Helper function to safely get number from query params
const getNumberParam = (param: any): number | undefined => {
  const str = getStringParam(param);
  if (str) {
    const num = Number(str);
    return isNaN(num) ? undefined : num;
  }
  return undefined;
};

// ✅ NEW: Helper function to safely get boolean from query params
const getBooleanParam = (param: any): boolean => {
  const str = getStringParam(param);
  return str === 'true' || str === '1';
};

// ============================================================
// PUBLIC ROUTES
// ============================================================

/**
 * Get products with filtering (Public)
 */
export const getProducts = async (req: Request, res: Response) => {
  try {
    // ✅ CHANGED: Using helper functions instead of direct parsing
    const category = getNumberParam(req.query.category);
    const search = getStringParam(req.query.search);
    const minPrice = getNumberParam(req.query.minPrice);
    const maxPrice = getNumberParam(req.query.maxPrice);

    // Build filter conditions
    const where: any = {
      is_available: true,
    };

    // Filter by category
    if (category) {
      where.category_id = category;
    }

    // Search by name or description
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = minPrice;
      }
      if (maxPrice) {
        where.price.lte = maxPrice;
      }
    }

    const products = await prisma.products.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: products,
      meta: {
        total: products.length,
        filters: {
          category: category || null,
          search: search || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get categories (Public)
 */
export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.categories.findMany({
      include: {
        products: {
          where: {
            is_available: true,
          },
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        category_name: 'asc',
      },
    });

    const formattedCategories = categories.map((category) => ({
      id: category.id,
      name: category.category_name,
      product_count: category.products.length,
    }));

    res.json({
      success: true,
      data: formattedCategories,
      meta: {
        total: categories.length,
      },
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get single product by ID (Public)
 */
export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productId = typeof id === 'string' ? id : String(id);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await prisma.products.findUnique({
      where: {
        id: productId,
        is_available: true,
      },
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
        orderItems: {
          select: {
            id: true,
            quantity: true,
            subtotal: true,
          },
        },
      },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================
// ADMIN ROUTES
// ============================================================

/**
 * Get all products (Admin only - includes unavailable products)
 * ✅ Updated to match order controller patterns
 */
export const getAllProductsAdmin = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ CHANGED: Using helper functions
    const category = getNumberParam(req.query.category);
    const search = getStringParam(req.query.search);
    const minPrice = getNumberParam(req.query.minPrice);
    const maxPrice = getNumberParam(req.query.maxPrice);
    const includeUnavailable = getBooleanParam(req.query.includeUnavailable);

    // Build filter conditions
    const where: any = {};

    // Include unavailable products if requested
    if (!includeUnavailable) {
      where.is_available = true;
    }

    // Filter by category
    if (category) {
      where.category_id = category;
    }

    // Search by name or description
    if (search && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        where.price.gte = minPrice;
      }
      if (maxPrice) {
        where.price.lte = maxPrice;
      }
    }

    const products = await prisma.products.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
        orderItems: {
          select: {
            quantity: true,
            subtotal: true,
          },
        },
      },
      orderBy: [
        { name: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: products,
      meta: {
        total: products.length,
        available: products.filter(p => p.is_available).length,
        unavailable: products.filter(p => !p.is_available).length,
        filters: {
          category: category || null,
          search: search || null,
          minPrice: minPrice || null,
          maxPrice: maxPrice || null,
          includeUnavailable: includeUnavailable || false,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching admin products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Create new product (Admin only)
 * ✅ Added validation and error handling
 */
export const createProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      description,
      price,
      image_url,
      category_id,
      stock_quantity = 0,
      is_available = true
    } = req.body;

    // ✅ CHANGED: Better validation with trim()
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product name is required'
      });
    }

    if (!description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Product description is required'
      });
    }

    if (price === undefined || price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    if (!category_id) {
      return res.status(400).json({
        success: false,
        message: 'Category is required'
      });
    }

    // Check if category exists
    const category = await prisma.categories.findUnique({
      where: { id: category_id }
    });

    if (!category) {
      return res.status(400).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check for duplicate product name
    const existingProduct = await prisma.products.findFirst({
      where: {
        name: {
          equals: name.trim(),
          mode: 'insensitive'
        }
      }
    });

    if (existingProduct) {
      return res.status(400).json({
        success: false,
        message: 'A product with this name already exists'
      });
    }

    // Create the product
    const product = await prisma.products.create({
      data: {
        name: name.trim(),
        description: description.trim(),
        price: price,
        image_url: image_url || '',
        category_id: category_id,
        stock_quantity: stock_quantity,
        is_available: is_available
      },
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update product (Admin only)
 * ✅ Accepts stock_quantity and is_available (Core Objective 2)
 * ✅ Added audit logging
 */
export const updateProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productId = typeof id === 'string' ? id : String(id);
    
    const { 
      stock_quantity, 
      is_available, 
      name, 
      description, 
      price, 
      category_id,
      image_url 
    } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    // Check if product exists
    const existingProduct = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!existingProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // ✅ CHANGED: Better validation with descriptive messages
    // Validate stock quantity
    if (stock_quantity !== undefined && stock_quantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Stock quantity cannot be negative'
      });
    }

    // Validate price
    if (price !== undefined && price < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price cannot be negative'
      });
    }

    // Build update data
    const updateData: any = {};

    // ✅ KEY: Update stock quantity (Core Objective 2)
    if (stock_quantity !== undefined) {
      updateData.stock_quantity = stock_quantity;
    }

    // ✅ KEY: Update availability (Core Objective 2)
    if (is_available !== undefined) {
      updateData.is_available = is_available;
    }

    // Optional fields
    if (name !== undefined && name.trim()) {
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (price !== undefined) {
      updateData.price = price;
    }

    if (image_url !== undefined) {
      updateData.image_url = image_url;
    }

    if (category_id !== undefined) {
      const category = await prisma.categories.findUnique({
        where: { id: category_id }
      });
      if (!category) {
        return res.status(400).json({
          success: false,
          message: 'Category not found'
        });
      }
      updateData.category_id = category_id;
    }

    // Update product
    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: updateData,
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
      },
    });

    // ✅ NEW: Audit logging (matching order controller pattern)
    console.log(`Product ${productId} updated by ${req.user?.email || 'Admin'}:`, {
      changes: updateData,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Toggle product availability (Admin only)
 * ✅ Quick toggle for is_available
 */
export const toggleProductAvailability = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productId = typeof id === 'string' ? id : String(id);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await prisma.products.findUnique({
      where: { id: productId }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const updatedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        is_available: !product.is_available
      },
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: `Product ${updatedProduct.is_available ? 'activated' : 'deactivated'} successfully`,
      data: updatedProduct
    });
  } catch (error) {
    console.error('Error toggling product availability:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle product availability',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Bulk update products (Admin only)
 * ✅ Added better error handling and logging
 */
export const bulkUpdateProducts = async (req: AuthRequest, res: Response) => {
  try {
    const { updates } = req.body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of product updates'
      });
    }

    // Validate max updates
    if (updates.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 100 products can be updated at once'
      });
    }

    const results: any[] = [];
    const errors: any[] = [];

    for (const update of updates) {
      try {
        const { id, ...updateData } = update;
        const productId = typeof id === 'string' ? id : String(id);

        if (!productId) {
          errors.push({ id, error: 'Invalid product ID' });
          continue;
        }

        // Check if product exists
        const product = await prisma.products.findUnique({
          where: { id: productId }
        });

        if (!product) {
          errors.push({ id: productId, error: 'Product not found' });
          continue;
        }

        // Validate stock quantity
        if (updateData.stock_quantity !== undefined && updateData.stock_quantity < 0) {
          errors.push({ id: productId, error: 'Stock quantity cannot be negative' });
          continue;
        }

        const updatedProduct = await prisma.products.update({
          where: { id: productId },
          data: updateData,
          include: {
            category: {
              select: {
                id: true,
                category_name: true,
              },
            },
          },
        });

        results.push(updatedProduct);
      } catch (error: any) {
        errors.push({ 
          id: update.id, 
          error: error.message || 'Update failed' 
        });
      }
    }

    res.json({
      success: true,
      message: `Updated ${results.length} products, ${errors.length} failed`,
      data: {
        updated: results,
        errors: errors
      }
    });
  } catch (error) {
    console.error('Error in bulk update:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get low stock products (Admin only)
 * ✅ Added better meta data
 */
export const getLowStockProducts = async (req: AuthRequest, res: Response) => {
  try {
    const thresholdParam = getNumberParam(req.query.threshold);
    const threshold = thresholdParam || 10;

    const products = await prisma.products.findMany({
      where: {
        stock_quantity: {
          lte: threshold
        }
      },
      include: {
        category: {
          select: {
            id: true,
            category_name: true,
          },
        },
      },
      orderBy: {
        stock_quantity: 'asc'
      }
    });

    res.json({
      success: true,
      count: products.length,
      data: products,
      meta: {
        threshold: threshold,
        total: products.length,
        outOfStock: products.filter(p => p.stock_quantity === 0).length,
        lowStock: products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= threshold).length,
      }
    });
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch low stock products',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Delete product (Admin only)
 * ✅ Soft delete with order check
 */
export const deleteProduct = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const productId = typeof id === 'string' ? id : String(id);

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const product = await prisma.products.findUnique({
      where: { id: productId },
      include: {
        orderItems: true
      }
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Check if product has orders
    if (product.orderItems && product.orderItems.length > 0) {
      // Soft delete - just mark as unavailable
      const updatedProduct = await prisma.products.update({
        where: { id: productId },
        data: {
          is_available: false,
          stock_quantity: 0
        },
        include: {
          category: {
            select: {
              id: true,
              category_name: true,
            },
          },
        },
      });

      return res.json({
        success: true,
        message: 'Product has been deactivated (has existing orders)',
        data: updatedProduct
      });
    }

    // Hard delete if no orders
    await prisma.products.delete({
      where: { id: productId }
    });

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete product',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};