import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { category, search, minPrice, maxPrice } = req.query;

    // Build filter conditions
    const where: any = {
      is_available: true,
    };

    // Filter by category
    if (category) {
      const categoryId = Number(category);
      if (!isNaN(categoryId)) {
        where.category_id = categoryId;
      }
    }

    // Search by name or description
    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { name: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) {
        const min = Number(minPrice);
        if (!isNaN(min)) {
          where.price.gte = min;
        }
      }
      if (maxPrice) {
        const max = Number(maxPrice);
        if (!isNaN(max)) {
          where.price.lte = max;
        }
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