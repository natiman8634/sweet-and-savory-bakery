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
    const { items, order_type, scheduled_for, payment_method } = req.body as OrderInput;

    if (!items?.length || !order_type) {
      return res.status(400).json({ success: false, message: 'Missing required order fields' });
    }

    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    // Fetch the profile ID that links to the Orders table
    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: userId }
    });

    if (!profile) {
      return res.status(400).json({ success: false, message: 'Customer profile not found' });
    }

    // 1. Validate items...
    const { validatedItems, validationErrors } = await validateOrderItems(items);
    if (validationErrors.length > 0) return res.status(400).json({ success: false, errors: validationErrors });

    // 2. Calculate totals...
    const totalPrice = validatedItems.reduce((sum, item) => sum + Number(item.subtotal), 0);

    // 4. Create order using profile.id
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.orders.create({
        data: {
          customer_id: profile.id, // Use the profile ID here
          total_price: totalPrice,
          order_type: order_type,
          scheduled_for: scheduled_for ? new Date(scheduled_for) : new Date(Date.now() + 3600000),
          status_id: 1, // Ensure this matches your 'Pending' status ID
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

      // 5. Deduct stock...
      for (const item of validatedItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: { stock_quantity: { decrement: item.quantity } }
        });
      }
      return order;
    });

    // 7. Notification (Use the USER ID for the notifications table, not the profile ID)
    await prisma.notifications.create({
      data: {
        user_id: userId, // Keep this as the User ID
        message: `Order #${result.id.slice(0, 8)} placed successfully.`,
        trigger_type: 'Order_Update'
      }
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error:', error);
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

    // ✅ FIXED: Fetch customer profile to accurately map profile ID to ownership check
    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: req.user?.userId }
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

    // ✅ FIXED: Map the authenticated user to their profile id to correctly match ownership parameters
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
 * Get order statistics
 */
export const getOrderStats = async (_req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.orders.findMany({
      include: { status: true }
    });

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_price), 0);

    const statusBreakdown = orders.reduce((acc: Record<string, number>, order) => {
      const statusName = order.status?.status_name || 'Unknown';
      acc[statusName] = (acc[statusName] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        totalOrders,
        totalRevenue,
        statusBreakdown,
      },
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

    // ✅ FIXED: Fetch user profile to match profile.id with order.customer_id
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