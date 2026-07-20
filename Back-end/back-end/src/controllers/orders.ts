import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js';
import { orderSchema } from '../utils/validators.js';
import { sendOrderConfirmation, sendOrderStatusUpdate } from '../services/emailService.js';

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

    // ✅ FIX: Convert Decimal to number using Number()
    const price = Number(product.price);
    validatedItems.push({
      ...item,
      product,
      subtotal: price * item.quantity
    });
  }

  return { validatedItems, validationErrors };
};

/**
 * Create a new order with inventory validation
 * ✅ Sends order confirmation email
 */
export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const validation = orderSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, errors: validation.error.format() });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const profile = await prisma.customerProfiles.findUnique({ where: { user_id: userId } });
    if (!profile) return res.status(400).json({ success: false, message: 'Profile not found' });

    const { items, order_type, scheduled_for } = validation.data;
    const { validatedItems, validationErrors } = await validateOrderItems(items);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({ success: false, errors: validationErrors });
    }

    // ✅ FIX: Convert Decimal to number using Number()
    const totalPrice = validatedItems.reduce((sum, item) => Number(sum) + Number(item.subtotal), 0);

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          customer_id: profile.id,
          total_price: totalPrice,
          order_type,
          scheduled_for: scheduled_for ? new Date(scheduled_for) : new Date(Date.now() + 3600000),
          status_id: 1, // 'Pending'
          orderItems: {
            create: validatedItems.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              subtotal: Number(item.subtotal)
            }))
          }
        },
        include: { orderItems: { include: { product: true } } }
      });

      for (const item of validatedItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } }
        });
      }
      return order;
    });

    await prisma.notifications.create({
      data: {
        user_id: userId,
        message: `Order #${result.id.slice(0, 8)} placed successfully.`,
        trigger_type: 'Order_Update'
      }
    });

    // ✅ 5. SEND ORDER CONFIRMATION EMAIL
    console.log('📧 Attempting to send order confirmation email...');
    const user = await prisma.users.findUnique({
      where: { id: userId },
      include: { profile: true }
    });

    console.log('📧 User found:', user?.email);
    console.log('📧 User name:', user?.profile?.full_name);

    if (user?.email) {
      console.log('📧 Sending order confirmation to:', user.email);
      const customerName = user?.profile?.full_name || 'Customer';
      
      // ✅ FIX: Convert Decimal to number using Number()
      sendOrderConfirmation(
        user.email,
        customerName,
        result.id,
        result.orderItems,
        Number(result.total_price),
        result.order_type,
        result.scheduled_for
      ).catch(error => console.error('❌ Email send error:', error));
    } else {
      console.log('❌ No user email found, skipping email');
    }

    res.status(201).json({ success: true, data: result });
  } catch (error) {
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

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // ✅ FIXED: Fetch customer profile to accurately map profile ID to ownership check
    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: userId }
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

    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      });
    }

    // ✅ FIXED: Map the authenticated user to their profile id to correctly match ownership parameters
    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: userId }
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
// ============================================================
/**
 * Get orders for the authenticated customer
 * ✅ Sorted by created_at descending
 * ✅ Uses authenticated userId mapped to customerProfile id
 * ✅ Supports status filter
 * ✅ Supports pagination (limit, offset)
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

    const { limit = 10, offset = 0, status } = req.query;

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

    const orders = await prisma.orders.findMany({
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
        hasMore: Number(offset) + Number(limit) < total
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
// ============================================================
/**
 * Get all orders for admins with advanced filtering
 * ✅ Filter by status (e.g., /api/admin/orders?status=Pending)
 * ✅ Filter by date (e.g., /api/admin/orders?date=2026-07-09)
 * ✅ Dynamic Prisma 'where' clause handling query parameters
 */
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      limit = 20, 
      offset = 0, 
      status, 
      date,                                  
      fromDate,                              
      toDate,                                
      customer_id,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const where: any = {};

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
        take: Number(limit),
        skip: Number(offset),
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

    res.json({
      success: true,
      data: orders,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
        hasMore: Number(offset) + Number(limit) < total,
        filters: {
          status: status || null,
          date: date || null,
          fromDate: fromDate || null,
          toDate: toDate || null,
          customer_id: customer_id || null,
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

  // Get product details for each
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

  // Map products with their order counts
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
  // Total unique customers who placed orders
  const totalCustomers = await prisma.orders.groupBy({
    by: ['customer_id'],
    where: {
      created_at: dateFilter,
      customer_id: {
        not: null
      }
    }
  });

  // Customers with more than 1 order (returning)
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
    // Check if user is admin
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

    // 🟢 1. Revenue by Day (Last 7 days)
    const revenueByDay = await getRevenueByDay(7);

    // 🟢 2. Top 5 Products
    const topProducts = await getTopProducts(5);

    // 3. Basic stats
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

    // 4. Customer statistics
    const customerStats = await getCustomerStats(dateFilter);

    // ✅ FIX: Safely handle null/undefined values with proper type conversion
    const totalRevenueValue = Number(totalRevenue._sum.total_price || 0);
    
    // ✅ FIX: Calculate average order value safely with type conversion
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
        // 🟢 NEW: Revenue by day breakdown
        revenueByDay,
        // 🟢 NEW: Top 5 products
        topProducts,
        // 🟢 NEW: Customer statistics
        customerStats,
        // 🟢 NEW: Summary
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
// 🟢 TASK 1: ADVANCED SALES DASHBOARD
// ============================================================

/**
 * Get comprehensive dashboard data for admin
 * GET /api/admin/dashboard
 * Includes: Total revenue, orders count, average order value,
 * top 3 products, revenue comparison with yesterday,
 * hourly revenue breakdown (last 12 hours)
 */
export const getDashboardData = async (req: AuthRequest, res: Response) => {
  try {
    // Check if user is admin
    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // 1. Today's stats
    const todayStats = await prisma.orders.aggregate({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow
        },
        status: {
          status_name: {
            notIn: ['Cancelled', 'Unpaid']
          }
        }
      },
      _count: true,
      _sum: {
        total_price: true
      },
      _avg: {
        total_price: true
      }
    });

    // 2. Yesterday's stats (for comparison)
    const yesterdayStats = await prisma.orders.aggregate({
      where: {
        created_at: {
          gte: yesterday,
          lt: today
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

    // 3. Top 3 best-selling products today
    const topProducts = await prisma.orderItems.groupBy({
      by: ['product_id'],
      where: {
        order: {
          created_at: {
            gte: today,
            lt: tomorrow
          },
          status: {
            status_name: {
              notIn: ['Cancelled', 'Unpaid']
            }
          }
        }
      },
      _sum: {
        quantity: true
      },
      orderBy: {
        _sum: {
          quantity: 'desc'
        }
      },
      take: 3
    });

    // Get product details for top products
    const productIds = topProducts.map(item => item.product_id);
    const products = await prisma.products.findMany({
      where: {
        id: {
          in: productIds
        }
      },
      select: {
        id: true,
        name: true,
        price: true,
        image_url: true,
        category: {
          select: {
            category_name: true
          }
        }
      }
    });

    const topProductsWithDetails = topProducts.map(item => {
      const product = products.find(p => p.id === item.product_id);
      const productPrice = product?.price ? Number(product.price) : 0;
      const totalQuantity = item._sum.quantity || 0;
      
      return {
        product_id: item.product_id,
        name: product?.name || 'Unknown',
        category: product?.category?.category_name || 'Uncategorized',
        total_quantity_sold: totalQuantity,
        price: productPrice,
        revenue: productPrice * totalQuantity
      };
    });

    // 4. Hourly revenue breakdown (last 12 hours)
    const twelveHoursAgo = new Date(now);
    twelveHoursAgo.setHours(now.getHours() - 12);

    // ✅ FIXED: Use "Orders" with double quotes (PostgreSQL is case-sensitive)
    const hourlyRevenue = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('hour', "created_at") as hour,
        SUM("total_price") as revenue,
        COUNT(*) as orders_count
      FROM "Orders"
      WHERE 
        "created_at" >= ${twelveHoursAgo}
        AND "created_at" <= ${now}
        AND "status_id" NOT IN (
          SELECT id FROM "OrderStatuses" WHERE status_name IN ('Cancelled', 'Unpaid')
        )
      GROUP BY DATE_TRUNC('hour', "created_at")
      ORDER BY hour ASC
    ` as any[];

    // Format hourly data
    const hourlyBreakdown = hourlyRevenue.map((item: any) => ({
      hour: new Date(item.hour).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        hour12: false 
      }),
      revenue: Number(item.revenue) || 0,
      ordersCount: Number(item.orders_count) || 0
    }));

    // 5. Calculate revenue comparison
    const todayRevenue = todayStats._sum.total_price ? Number(todayStats._sum.total_price) : 0;
    const yesterdayRevenue = yesterdayStats._sum.total_price ? Number(yesterdayStats._sum.total_price) : 0;
    
    let revenueChangePercentage = 0;
    if (yesterdayRevenue > 0) {
      revenueChangePercentage = ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100;
    } else if (todayRevenue > 0) {
      revenueChangePercentage = 100;
    }

    // 6. Additional KPIs
    const totalOrders = todayStats._count || 0;
    const averageOrderValue = todayStats._avg.total_price ? Number(todayStats._avg.total_price) : 0;

    // 7. Get today's orders for recent activity
    const recentOrders = await prisma.orders.findMany({
      where: {
        created_at: {
          gte: today,
          lt: tomorrow
        },
        status: {
          status_name: {
            notIn: ['Cancelled', 'Unpaid']
          }
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
          take: 2,
          include: {
            product: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      },
      take: 5
    });

    res.json({
      success: true,
      data: {
        date: today.toISOString().split('T')[0],
        summary: {
          totalRevenue: todayRevenue,
          totalOrders,
          averageOrderValue,
          revenueChangePercentage: Number(revenueChangePercentage.toFixed(1)),
          trend: revenueChangePercentage >= 0 ? 'up' : 'down'
        },
        topProducts: topProductsWithDetails,
        hourlyBreakdown,
        recentOrders: recentOrders.map(order => ({
          id: order.id.slice(0, 8),
          customerName: order.customer?.full_name || 'Guest',
          customerEmail: order.customer?.user?.email || 'guest@example.com',
          total: Number(order.total_price),
          status: order.status?.status_name || 'Unknown',
          items: order.orderItems.map(item => item.product?.name).join(', '),
          time: order.created_at.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
          })
        })),
        comparison: {
          todayRevenue,
          yesterdayRevenue,
          change: Number(revenueChangePercentage.toFixed(1)),
          changeAmount: Number(todayRevenue - yesterdayRevenue)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error instanceof Error ? error.message : 'Unknown error'
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
    // Check if user is admin
    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { fromDate, toDate } = req.query;

    // Validate date parameters
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

    // Set to end of day for toDate
    toDateObj.setHours(23, 59, 59, 999);

    // Fetch orders within date range
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

    // Generate CSV content
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

    // Build CSV string
    let csvContent = csvHeaders.join(',') + '\n';
    csvRows.forEach(row => {
      // Escape quotes and wrap fields with commas in quotes
      const escapedRow = row.map(field => {
        if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      });
      csvContent += escapedRow.join(',') + '\n';
    });

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=orders_${fromDate}_to_${toDate}.csv`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Pragma', 'no-cache');

    // Send CSV
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
 * ✅ Sends status update email
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

    // ✅ FIX: Added profile: true to include customer's profile
    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status_id: targetStatus.id,
      },
      include: {
        status: true,
        customer: {
          include: {
            user: {
              select: { 
                id: true, 
                email: true 
              }
            },
            profile: true  // ✅ This is the fix for full_name
          }
        },
      },
    });

    // ✅ FIX: Safely access full_name with optional chaining
    const customerName = updatedOrder.customer?.full_name || 'Customer';
    const customerEmail = updatedOrder.customer?.user?.email;

    // ✅ SEND STATUS UPDATE EMAIL
    console.log('📧 Attempting to send status update email...');
    console.log('📧 Customer email:', customerEmail);
    console.log('📧 Customer name:', customerName);
    console.log('📧 Status:', updatedOrder.status?.status_name);
    
    if (customerEmail) {
      sendOrderStatusUpdate(
        customerEmail,
        customerName,
        updatedOrder.id,
        updatedOrder.status?.status_name || 'Updated'
      ).catch(error => console.error('❌ Status email error:', error));
    } else {
      console.log('❌ No user email found, skipping status email');
    }

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
// PATCH /api/orders/:id/cancel
export const cancelOrder = async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const userId = req.user?.userId;
    const { reason } = req.body; // Capture the new cancellation reason

    if (!id || !userId) {
      return res.status(400).json({ success: false, message: 'Invalid request' });
    }

    // Include the relations required for logic checks
    const order = await prisma.orders.findUnique({
      where: { id },
      include: { orderItems: true, status: true }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Permissions check
    const profile = await prisma.customerProfiles.findUnique({ where: { user_id: userId } });
    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = profile && order.customer_id === profile.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    // State check
    if (!['Pending', 'Unpaid', 'Preparing'].includes(order.status.status_name)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel order in current state' });
    }

    const cancelledStatus = await prisma.orderStatuses.findFirst({ where: { status_name: 'Cancelled' } });
    if (!cancelledStatus) return res.status(500).json({ success: false, message: 'Status configuration error' });

    // Transaction to update order, restore stock, and log the change
    await prisma.$transaction(async (tx) => {
      // 1. Update Order Status and Reason
      await tx.orders.update({
        where: { id },
        data: { 
          status_id: cancelledStatus.id,
          cancellation_reason: reason || 'Customer requested cancellation' 
        }
      });

      // 2. Restore Stock
      for (const item of order.orderItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock_quantity: { increment: item.quantity } }
        });
      }

      // 3. Optional: Log the status change
      await tx.orderStatusLogs.create({
        data: {
          order_id: id,
          old_status: order.status_id,
          new_status: cancelledStatus.id
        }
      });

      // 4. Notify
      await tx.notifications.create({
        data: {
          user_id: userId,
          message: `Order #${id.slice(0, 8)} has been cancelled.`,
          trigger_type: 'Order_Update'
        }
      });
    });

    res.json({ success: true, message: 'Order cancelled successfully' });
  } catch (error) {
    console.error('Cancel Order Error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel order' });
  }
};

// POST /api/orders/guest
export const createGuestOrder = async (req: Request, res: Response) => {
  const { items, order_type, scheduled_for, customer_email, customer_phone } = req.body;
  
  try {
    // 1. Calculate price and validate stock (use your validateOrderItems helper)
    // 2. Create order without customer_id
    const newOrder = await prisma.orders.create({
      data: {
        order_type: 'Guest',
        customer_email,
        customer_phone,
        total_price: 0, // Calculate from items
        scheduled_for: new Date(scheduled_for),
        status_id: 1, // 'Pending'
        orderItems: { create: items } 
      }
    });
    res.status(201).json({ success: true, data: newOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Guest order failed' });
  }
};