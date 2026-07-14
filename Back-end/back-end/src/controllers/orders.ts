import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { orderSchema } from '../utils/validators.js';

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

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

interface OrderInput {
  customer_id?: string;
  items: OrderItemInput[];
  order_type: string;
  scheduled_for?: string;
  payment_method?: string;
}

/**
 * Validate product availability and stock before creating order
 */
const validateOrderItems = async (items: OrderItemInput[]) => {
  const validationErrors: any[] = [];
  const validatedItems: any[] = [];

  for (const item of items) {
    const product = await prisma.products.findUnique({
      where: { id: item.product_id }
    });

    if (!product) {
      validationErrors.push({
        product_id: item.product_id,
        error: 'Product not found'
      });
      continue;
    }

    // Check 1: Product availability
    if (!product.is_available) {
      validationErrors.push({
        product_id: item.product_id,
        product_name: product.name,
        error: `Product "${product.name}" is currently unavailable`
      });
      continue;
    }

    // Check 2: Stock quantity
    if (product.stock_quantity < item.quantity) {
      validationErrors.push({
        product_id: item.product_id,
        product_name: product.name,
        available: product.stock_quantity,
        requested: item.quantity,
        error: `Insufficient stock for "${product.name}". Available: ${product.stock_quantity}`
      });
      continue;
    }

    // Check 3: Quantity validation
    if (item.quantity <= 0) {
      validationErrors.push({
        product_id: item.product_id,
        product_name: product.name,
        error: `Invalid quantity for "${product.name}". Quantity must be at least 1`
      });
      continue;
    }

    validatedItems.push({
      ...item,
      product,
      subtotal: Number(product.price) * item.quantity
    });
  }

  return { validatedItems, validationErrors };
};

/**
 * Create a new order with inventory validation
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    // 1. Validate Input using Zod
    const validation = orderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid order data', 
        errors: validation.error.format() 
      });
    }

    const { items, order_type, scheduled_for } = validation.data;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const profile = await prisma.customerProfiles.findUnique({ where: { user_id: userId } });
    if (!profile) return res.status(400).json({ success: false, message: 'Customer profile not found' });

    // 2. Validate availability and stock
    const { validatedItems, validationErrors } = await validateOrderItems(items);
    if (validationErrors.length > 0) return res.status(400).json({ success: false, errors: validationErrors });

    const totalPrice = validatedItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // 3. Database Transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          customer_id: profile.id,
          total_price: totalPrice,
          order_type: order_type,
          scheduled_for: scheduled_for ? new Date(scheduled_for) : new Date(Date.now() + 3600000),
          status_id: 1,
          orderItems: {
            create: validatedItems.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              subtotal: item.subtotal
            }))
          }
        },
        include: { orderItems: true }
      });

      for (const item of validatedItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } }
        });
      }
      return order;
    });

    // 4. Create Notification
    await prisma.notifications.create({
      data: {
        user_id: userId,
        message: `Order #${result.id.slice(0, 8)} placed successfully.`,
        trigger_type: 'Order_Update'
      }
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ success: false, message: 'Failed to create order' });
  }
};

/**
 * Get a single order by ID
 */
export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderId = typeof id === 'string' ? id : String(id);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image_url: true,
                price: true,
                stock_quantity: true,
                is_available: true,
              },
            },
          },
        },
        status: {
          select: {
            id: true,
            status_name: true,
          },
        },
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
              }
            }
          }
        },
        payment: {
          select: {
            id: true,
            amount: true,
            payment_method: true,
            payment_status: true,
            transaction_reference: true,
            paid_at: true,
          },
        },
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    const profile = await prisma.customerProfiles.findFirst({
  where: { 
    user_id: req.user?.userId || '' 
  }
});

    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = profile && order.customer_id === profile.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this order'
      });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get customer orders with filtering (Generic Endpoint)
 */
export const getCustomerOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { customerId } = req.params;
    const { limit = 10, offset = 0, status } = req.query;

    const customerIdStr = typeof customerId === 'string' ? customerId : String(customerId);

    if (!customerIdStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID',
      });
    }

    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: req.user?.userId }
    });

    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = profile && customerIdStr === profile.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these orders'
      });
    }

    const where: any = {
      customer_id: customerIdStr,
    };

    if (status) {
      const statusMap: Record<string, number> = {
        'pending': 1,
        'processing': 2,
        'preparing': 3,
        'ready': 4,
        'completed': 5,
        'cancelled': 6,
        'unpaid': 7,
      };
      const statusId = statusMap[status as string];
      if (statusId) {
        where.status_id = statusId;
      }
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                image_url: true,
                price: true,
              },
            },
          },
        },
        status: {
          select: {
            id: true,
            status_name: true,
          },
        },
        payment: {
          select: {
            id: true,
            amount: true,
            payment_status: true,
            payment_method: true,
            paid_at: true,
          },
        },
      },
      orderBy: {
        created_at: 'desc',
      },
      take: Number(limit),
      skip: Number(offset),
    });

    const total = await prisma.orders.count({ where });

    res.json({
      success: true,
      data: orders,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================
// 🟢 DELIVERABLE 1: CUSTOMER SIDE - GET /api/orders/my-orders
// 🟢 TASK 9: Added Pagination with page & limit
// ============================================================
/**
 * Get orders for the authenticated customer
 * ✅ Sorted by created_at descending
 * ✅ Uses authenticated userId mapped to customerProfile id
 * ✅ Supports status filter
 * ✅ Supports pagination (page & limit) - TASK 9
 */
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // 🟢 TASK 9: Get pagination parameters
    const { 
      limit = 10, 
      offset = 0, 
      page = 1,
      status 
    } = req.query;

    // 🟢 TASK 9: Calculate pagination values
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(50, Math.max(1, Number(limit) || 10));
    const offsetNumber = (pageNumber - 1) * limitNumber;

    const customerProfile = await prisma.customerProfiles.findFirst({
      where: { user_id: userId }
    });

    const where: any = customerProfile
      ? { customer_id: customerProfile.id }
      : { customer_id: userId };

    if (status) {
      const statusMap: Record<string, number> = {
        'pending': 1,
        'unpaid': 7,
        'processing': 2,
        'preparing': 3,
        'ready': 4,
        'completed': 5,
        'cancelled': 6,
      };
      
      let statusId = statusMap[status as string];
      
      if (!statusId) {
        const statusRecord = await prisma.orderStatuses.findFirst({
          where: { 
            status_name: {
              equals: status as string,
              mode: 'insensitive'
            }
          }
        });
        if (statusRecord) {
          statusId = statusRecord.id;
        }
      }
      
      if (statusId) {
        where.status_id = statusId;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status: ${status}`
        });
      }
    }

    // 🟢 TASK 9: Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          status: {
            select: {
              id: true,
              status_name: true,
            },
          },
          orderItems: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  image_url: true,
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              amount: true,
              payment_status: true,
              payment_method: true,
              paid_at: true,
            }
          }
        },
        orderBy: { 
          created_at: 'desc' 
        },
        take: limitNumber,
        skip: offsetNumber,
      }),
      prisma.orders.count({ where })
    ]);

    // 🟢 TASK 9: Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNumber);
    const currentPage = pageNumber;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    res.json({
      success: true,
      data: orders,
      meta: {
        pagination: {
          currentPage,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNumber,
          hasNextPage,
          hasPreviousPage,
          nextPage: hasNextPage ? currentPage + 1 : null,
          previousPage: hasPreviousPage ? currentPage - 1 : null,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching my orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================
// 🟢 DELIVERABLE 2: ADMIN SIDE - GET /api/admin/orders
// 🟢 TASK 9: Pagination with page & limit
// 🟢 TASK 10: Search by customer name or Order ID
// ============================================================
/**
 * Get all orders for admins with advanced filtering
 * ✅ Filter by status (e.g., /api/admin/orders?status=Pending)
 * ✅ Filter by date (e.g., /api/admin/orders?date=2026-07-09)
 * ✅ Dynamic Prisma 'where' clause handling query parameters
 * ✅ TASK 9: Pagination with page & limit
 * ✅ TASK 10: Search by customer name or Order ID
 */
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    // 🟢 TASK 9 & 10: Get all query parameters
    const { 
      limit = 20, 
      offset = 0, 
      page = 1,                    // 🟢 TASK 9: Page number
      status, 
      date,                                  
      fromDate,                              
      toDate,                                
      customer_id,
      search,                      // 🟢 TASK 10: Search term
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // 🟢 TASK 9: Calculate pagination values
    const pageNumber = Math.max(1, Number(page) || 1);
    const limitNumber = Math.min(100, Math.max(1, Number(limit) || 20));
    const offsetNumber = (pageNumber - 1) * limitNumber;

    const where: any = {};

    // 🟢 TASK 10: Search by customer name or Order ID
    if (search && typeof search === 'string' && search.trim()) {
      const searchTerm = search.trim();
      
      // Check if search term looks like an Order ID (UUID)
      const isOrderId = searchTerm.length >= 8 && searchTerm.match(/^[0-9a-f-]+$/i);
      
      if (isOrderId) {
        // Search by Order ID (partial match)
        where.id = {
          contains: searchTerm,
          mode: 'insensitive'
        };
      } else {
        // Search by customer name or email through the profile
        where.OR = [
          {
            customer: {
              full_name: {
                contains: searchTerm,
                mode: 'insensitive'
              }
            }
          },
          {
            customer: {
              user: {
                email: {
                  contains: searchTerm,
                  mode: 'insensitive'
                }
              }
            }
          }
        ];
      }
    }

    // Dynamic Filter: Status Name
    if (status) {
      const statusRecord = await prisma.orderStatuses.findFirst({
        where: {
          status_name: {
            equals: status as string,
            mode: 'insensitive'
          }
        }
      });
      
      if (statusRecord) {
        where.status_id = statusRecord.id;
      } else {
        return res.status(400).json({
          success: false,
          message: `Invalid status: ${status}.`
        });
      }
    }

    // Dynamic Filter: Specific Day Window
    if (date) {
      const dateObj = new Date(date as string);
      if (isNaN(dateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid date format. Use YYYY-MM-DD'
        });
      }
      
      const startOfDay = new Date(dateObj);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(dateObj);
      endOfDay.setHours(23, 59, 59, 999);
      
      where.created_at = {
        gte: startOfDay,
        lte: endOfDay
      };
    }

    // Date range filters
    if (fromDate) {
      const fromDateObj = new Date(fromDate as string);
      if (!isNaN(fromDateObj.getTime())) {
        where.created_at = { ...where.created_at, gte: fromDateObj };
      }
    }

    if (toDate) {
      const toDateObj = new Date(toDate as string);
      if (!isNaN(toDateObj.getTime())) {
        toDateObj.setHours(23, 59, 59, 999);
        where.created_at = { ...where.created_at, lte: toDateObj };
      }
    }

    if (customer_id) {
      where.customer_id = customer_id as string;
    }

    const orderBy: any = {};
    const validSortFields = ['created_at', 'total_price', 'order_type', 'scheduled_for'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
    orderBy[sortField as string] = sortOrder === 'asc' ? 'asc' : 'desc';

    // 🟢 TASK 9: Execute queries with pagination
    const [orders, total] = await Promise.all([
      prisma.orders.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, email: true }
              }
            }
          },
          status: {
            select: { id: true, status_name: true }
          },
          orderItems: {
            include: {
              product: {
                include: {
                  category: { select: { id: true, category_name: true } }
                }
              }
            }
          },
          payment: {
            select: {
              id: true,
              amount: true,
              payment_method: true,
              payment_status: true,
              transaction_reference: true,
              paid_at: true,
            }
          }
        },
        orderBy,
        take: limitNumber,
        skip: offsetNumber,
      }),
      prisma.orders.count({ where })
    ]);

    const stats = await prisma.orders.aggregate({
      where,
      _count: { id: true },
      _sum: { total_price: true },
      _avg: { total_price: true },
      _min: { total_price: true },
      _max: { total_price: true }
    });

    // 🟢 TASK 9: Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNumber);
    const currentPage = pageNumber;
    const hasNextPage = currentPage < totalPages;
    const hasPreviousPage = currentPage > 1;

    res.json({
      success: true,
      data: orders,
      meta: {
        // 🟢 TASK 9: Pagination info
        pagination: {
          currentPage,
          totalPages,
          totalItems: total,
          itemsPerPage: limitNumber,
          hasNextPage,
          hasPreviousPage,
          nextPage: hasNextPage ? currentPage + 1 : null,
          previousPage: hasPreviousPage ? currentPage - 1 : null,
        },
        // Filters applied
        filters: {
          status: status || null,
          date: date || null,
          fromDate: fromDate || null,
          toDate: toDate || null,
          customer_id: customer_id || null,
          search: search || null,  // 🟢 TASK 10: Show search term
        },
        sorting: {
          sortBy: sortField,
          sortOrder: sortOrder
        },
        summary: {
          totalOrders: stats._count.id || 0,
          totalRevenue: Number(stats._sum.total_price) || 0,
          averageOrderValue: Number(stats._avg.total_price) || 0,
          minOrderValue: Number(stats._min.total_price) || 0,
          maxOrderValue: Number(stats._max.total_price) || 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================
// 🟢 TASK 1: ADVANCED STATISTICS - Updated getOrderStats
// ============================================================

/**
 * Helper: Get revenue breakdown by day for the last N days
 */
const getRevenueByDay = async (days: number = 7) => {
  const result = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);
    
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    
    const revenue = await prisma.orders.aggregate({
      where: {
        created_at: {
          gte: date,
          lt: nextDate
        },
        status: {
          status_name: {
            notIn: ['Cancelled', 'Unpaid']
          }
        }
      },
      _sum: {
        total_price: true
      }
    });

    const ordersCount = await prisma.orders.count({
      where: {
        created_at: {
          gte: date,
          lt: nextDate
        }
      }
    });

    result.push({
      date: date.toISOString().split('T')[0],
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      revenue: Number(revenue._sum.total_price || 0),
      ordersCount
    });
  }
  
  return result;
};

/**
 * Helper: Get top N most frequently ordered products
 */
const getTopProducts = async (limit: number = 5) => {
  const topProducts = await prisma.orderItems.groupBy({
    by: ['product_id'],
    _sum: {
      quantity: true
    },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: limit
  });

  const productIds = topProducts.map(item => item.product_id);
  const products = await prisma.products.findMany({
    where: {
      id: {
        in: productIds
      }
    },
    include: {
      category: {
        select: {
          id: true,
          category_name: true
        }
      }
    }
  });

  return topProducts.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return {
      product_id: item.product_id,
      name: product?.name || 'Unknown',
      category: product?.category?.category_name || 'Uncategorized',
      total_ordered: item._sum.quantity || 0,
      price: Number(product?.price || 0),
      image_url: product?.image_url || '',
      revenue: Number(product?.price || 0) * (item._sum.quantity || 0)
    };
  });
};

/**
 * Helper: Get customer statistics
 */
const getCustomerStats = async (dateFilter: any) => {
  const totalCustomers = await prisma.orders.groupBy({
    by: ['customer_id'],
    where: {
      created_at: dateFilter,
      customer_id: {
        not: null
      }
    }
  });

  const returningCustomers = await prisma.orders.groupBy({
    by: ['customer_id'],
    where: {
      created_at: dateFilter,
      customer_id: {
        not: null
      }
    },
    having: {
      customer_id: {
        _count: {
          gt: 1
        }
      }
    }
  });

  return {
    totalCustomers: totalCustomers.length,
    returningCustomers: returningCustomers.length,
    newCustomers: totalCustomers.length - returningCustomers.length
  };
};

/**
 * 🟢 TASK 1: Get advanced order statistics with revenue breakdown and top products
 */
export const getOrderStats = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { period = 'week' } = req.query;
    let dateFilter: any = {};
    const now = new Date();

    switch (period) {
      case 'today':
        dateFilter = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        };
        break;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(weekStart.getDate() - 7);
        dateFilter = {
          gte: weekStart
        };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          gte: monthStart
        };
        break;
      default:
        dateFilter = {
          gte: new Date(now.setHours(0, 0, 0, 0))
        };
    }

    const revenueByDay = await getRevenueByDay(7);
    const topProducts = await getTopProducts(5);

    const [totalOrders, totalRevenue, statusCounts] = await Promise.all([
      prisma.orders.count({
        where: { created_at: dateFilter }
      }),
      prisma.orders.aggregate({
        where: {
          created_at: dateFilter,
          status: {
            status_name: {
              notIn: ['Cancelled', 'Unpaid']
            }
          }
        },
        _sum: {
          total_price: true
        }
      }),
      prisma.orderStatuses.findMany({
        include: {
          orders: {
            where: { created_at: dateFilter }
          }
        }
      })
    ]);

    const statusBreakdown = statusCounts.map(status => ({
      status: status.status_name,
      count: status.orders.length
    }));

    const customerStats = await getCustomerStats(dateFilter);
    const totalRevenueValue = Number(totalRevenue._sum.total_price || 0);
    const averageOrderValue = totalOrders > 0 
      ? Number(totalRevenueValue) / totalOrders 
      : 0;

    res.json({
      success: true,
      data: {
        period,
        totalOrders,
        totalRevenue: totalRevenueValue,
        statusBreakdown,
        revenueByDay,
        topProducts,
        customerStats,
        summary: {
          averageOrderValue,
          totalCustomers: customerStats.totalCustomers,
          returningCustomers: customerStats.returningCustomers
        }
      }
    });
  } catch (error) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order statistics',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// ============================================================
// 🟢 TASK 2: EXPORT FUNCTIONALITY - CSV Export
// ============================================================

/**
 * Export orders as CSV
 * GET /api/admin/orders/export?fromDate=2026-07-01&toDate=2026-07-09
 */
export const exportOrdersCSV = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { fromDate, toDate } = req.query;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message: 'Both fromDate and toDate are required (YYYY-MM-DD)'
      });
    }

    const fromDateObj = new Date(fromDate as string);
    const toDateObj = new Date(toDate as string);

    if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date format. Use YYYY-MM-DD'
      });
    }

    toDateObj.setHours(23, 59, 59, 999);

    const orders = await prisma.orders.findMany({
      where: {
        created_at: {
          gte: fromDateObj,
          lte: toDateObj
        }
      },
      include: {
        customer: {
          include: {
            user: {
              select: {
                email: true
              }
            }
          }
        },
        status: true,
        orderItems: {
          include: {
            product: true
          }
        },
        payment: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    if (orders.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orders found in the specified date range'
      });
    }

    const csvHeaders = [
      'Order ID',
      'Date',
      'Customer Email',
      'Customer Name',
      'Order Type',
      'Status',
      'Total Price',
      'Payment Method',
      'Payment Status',
      'Items Count',
      'Products'
    ];

    const csvRows = orders.map(order => {
      const customerName = order.customer?.full_name || 'Guest';
      const customerEmail = order.customer?.user?.email || 'guest@example.com';
      const products = order.orderItems.map(item => 
        `${item.product.name} (x${item.quantity})`
      ).join('; ');
      const itemsCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);

      return [
        order.id.slice(0, 8),
        order.created_at.toISOString().split('T')[0],
        customerEmail,
        customerName,
        order.order_type,
        order.status?.status_name || 'Unknown',
        order.total_price.toString(),
        order.payment?.payment_method || 'N/A',
        order.payment?.payment_status || 'N/A',
        itemsCount,
        products
      ];
    });

    let csvContent = csvHeaders.join(',') + '\n';
    csvRows.forEach(row => {
      const escapedRow = row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${fromDate}_to_${toDate}.csv`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    res.status(200).send(csvContent);

  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update order status
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderId = typeof id === 'string' ? id : String(id);
    const { status, status_name, statusId } = req.body as {
      status?: string;
      status_name?: string;
      statusId?: number;
    };

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    let targetStatus = null;

    if (typeof statusId === 'number') {
      targetStatus = await prisma.orderStatuses.findUnique({ where: { id: statusId } });
    } else {
      const statusName = status || status_name;
      if (statusName) {
        targetStatus = await prisma.orderStatuses.findFirst({
          where: { status_name: statusName }
        });
      }
    }

    if (!targetStatus) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order status',
      });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status_id: targetStatus.id,
      },
      include: {
        status: true,
        customer: {
          include: {
            user: { select: { id: true, email: true } }
          }
        },
      },
    });

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder,
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update order status',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Cancel order (User or Admin)
 */
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (!id || !userId) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    const order = await prisma.orders.findUnique({
      where: { id: id as string },
      include: { orderItems: true, status: true }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: userId }
    });

    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = profile && order.customer_id === profile.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to cancel this order' });
    }

    const cancellableStatuses = ['Pending', 'Unpaid', 'Preparing'];
    if (!cancellableStatuses.includes(order.status.status_name)) {
      return res.status(400).json({ success: false, message: `Cannot cancel in "${order.status.status_name}"` });
    }

    const cancelledStatus = await prisma.orderStatuses.findFirst({ where: { status_name: 'Cancelled' } });
    if (!cancelledStatus) throw new Error('Status "Cancelled" not found');

    await prisma.$transaction(async (tx) => {
      await tx.orders.update({
        where: { id: id as string },
        data: { status_id: cancelledStatus.id }
      });

      for (const item of order.orderItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock_quantity: { increment: item.quantity } }
        });
      }

      await tx.notifications.create({
        data: {
          user_id: userId, 
          message: `Order #${id.slice(0, 8)} has been cancelled`,
          trigger_type: 'Order_Update'
        }
      });
    });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};