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
    const { 
      customer_id, 
      items, 
      order_type, 
      scheduled_for, 
      payment_method 
    } = req.body as OrderInput;

    // Validate required fields
    if (!items || !items.length) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one item'
      });
    }

    if (!order_type) {
      return res.status(400).json({
        success: false,
        message: 'Order type is required'
      });
    }

    // Use authenticated user ID if not provided
    const userId = customer_id || req.user?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    // 1. Validate all order items
    const { validatedItems, validationErrors } = await validateOrderItems(items);

    // If there are validation errors, reject the order
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Order validation failed',
        errors: validationErrors
      });
    }

    // 2. Calculate total price
    const totalPrice = validatedItems.reduce(
      (sum: number, item: any) => sum + item.subtotal,
      0
    );

    // 3. Get default status (Pending)
    const pendingStatus = await prisma.orderStatuses.findFirst({
      where: { status_name: 'Pending' }
    });

    if (!pendingStatus) {
      throw new Error('Order status "Pending" not found');
    }

    // 4. Create order with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the order
      const order = await tx.orders.create({
        data: {
          customer_id: userId,
          total_price: totalPrice,
          order_type: order_type,
          scheduled_for: scheduled_for ? new Date(scheduled_for) : new Date(Date.now() + 3600000),
          status_id: pendingStatus.id,
          orderItems: {
            create: validatedItems.map((item: any) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              subtotal: item.subtotal
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true
            }
          },
          status: true
        }
      });

      // 5. Deduct stock for each item
      for (const item of validatedItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              decrement: item.quantity
            }
          }
        });
      }

      // 6. Create payment record if payment method provided
      if (payment_method) {
        await tx.payments.create({
          data: {
            order_id: order.id,
            amount: totalPrice,
            payment_method: payment_method,
            payment_status: 'Pending',
            transaction_reference: `TXN-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          }
        });
      }

      return order;
    }, {
      timeout: 15000 // 15s timeout
    });

    // 7. Create notification for the user
    if (userId) {
      await prisma.notifications.create({
        data: {
          user_id: userId,
          message: `Order #${result.id.slice(0, 8)} has been placed successfully. Total: $${totalPrice.toFixed(2)}`,
          trigger_type: 'Order_Update'
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get order by ID with authorization check
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

    // Check authorization - only admin or order owner can view
    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = order.customer_id === req.user?.userId;

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
 * Get customer orders with filtering
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

    // Check authorization - only admin or the customer themselves can view
    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = customerIdStr === req.user?.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view these orders'
      });
    }

    const where: any = {
      customer_id: customerIdStr,
    };

    // If status filter is provided
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

/**
 * Get all orders with filtering (Admin only)
 */
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 20, offset = 0, status, customer_id, fromDate, toDate } = req.query;

    // Check if user is admin
    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const where: any = {};

    // Filter by status
    if (status) {
      const statusRecord = await prisma.orderStatuses.findFirst({
        where: { status_name: status as string }
      });
      if (statusRecord) {
        where.status_id = statusRecord.id;
      }
    }

    // Filter by customer
    if (customer_id) {
      where.customer_id = customer_id as string;
    }

    // Filter by date range
    if (fromDate) {
      where.created_at = {
        gte: new Date(fromDate as string)
      };
    }
    if (toDate) {
      where.created_at = {
        ...where.created_at,
        lte: new Date(toDate as string)
      };
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
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
        status: true,
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        payment: true
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
 * Get my orders (current user)
 */
export const getMyOrders = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user?.userId) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const { limit = 10, offset = 0, status } = req.query;

    const where: any = {
      customer_id: req.user.userId
    };

    // Filter by status
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
        status: true,
        orderItems: {
          include: {
            product: {
              include: {
                category: true
              }
            }
          }
        },
        payment: true
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
      count: orders.length,
      data: orders,
      meta: {
        total,
        limit: Number(limit),
        offset: Number(offset),
      }
    });
  } catch (error) {
    console.error('Error fetching your orders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch your orders',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Update order status (Admin only)
 */
export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status_name } = req.body;

    const orderId = typeof id === 'string' ? id : String(id);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID'
      });
    }

    if (!status_name) {
      return res.status(400).json({
        success: false,
        message: 'Status name is required'
      });
    }

    // Check if user is admin
    if (req.user?.role?.role_name !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    // Get the status
    const status = await prisma.orderStatuses.findFirst({
      where: { status_name }
    });

    if (!status) {
      return res.status(404).json({
        success: false,
        message: 'Status not found'
      });
    }

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        status: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Prevent status change if already cancelled
    if (order.status.status_name === 'Cancelled' && status_name !== 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a cancelled order'
      });
    }

    // Prevent status change if already completed
    if (order.status.status_name === 'Completed' && status_name !== 'Completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot change status of a completed order'
      });
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status_id: status.id
      },
      include: {
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
        status: true,
        orderItems: {
          include: {
            product: true
          }
        },
        payment: true
      }
    });

    // If order is cancelled, restore stock
    if (status_name === 'Cancelled') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.orderItems) {
          await tx.products.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: {
                increment: item.quantity
              }
            }
          });
        }
      });
    }

    // Create notification
    if (order.customer_id) {
      await prisma.notifications.create({
        data: {
          user_id: order.customer_id,
          message: `Order #${order.id.slice(0, 8)} status updated to: ${status_name}`,
          trigger_type: 'Order_Update'
        }
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: updatedOrder
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
    const orderId = typeof id === 'string' ? id : String(id);

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid order ID',
      });
    }

    const isAdmin = req.user?.role?.role_name === 'Admin';

    const order = await prisma.orders.findUnique({
      where: { id: orderId },
      include: {
        orderItems: true,
        status: true
      }
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user can cancel this order
    const isOwner = order.customer_id === req.user?.userId;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to cancel this order'
      });
    }

    // Check if order can be cancelled
    const cancellableStatuses = ['Pending', 'Unpaid', 'Preparing'];
    if (!cancellableStatuses.includes(order.status.status_name)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled in "${order.status.status_name}" status`
      });
    }

    // Get cancelled status
    const cancelledStatus = await prisma.orderStatuses.findFirst({
      where: { status_name: 'Cancelled' }
    });

    if (!cancelledStatus) {
      throw new Error('Cancelled status not found');
    }

    // Update order status and restore stock
    const result = await prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status_id: cancelledStatus.id
        },
        include: {
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
          status: true,
          orderItems: {
            include: {
              product: true
            }
          },
          payment: true
        }
      });

      // Restore stock
      for (const item of order.orderItems) {
        await tx.products.update({
          where: { id: item.product_id },
          data: {
            stock_quantity: {
              increment: item.quantity
            }
          }
        });
      }

      return updatedOrder;
    }, {
      timeout: 15000
    });

    // Create notification
    if (order.customer_id) {
      await prisma.notifications.create({
        data: {
          user_id: order.customer_id,
          message: `Order #${order.id.slice(0, 8)} has been cancelled`,
          trigger_type: 'Order_Update'
        }
      });
    }

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: result
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

/**
 * Get order statistics (Admin only)
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

    const { period = 'today' } = req.query;
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

    const [totalOrders, totalRevenue, statusCounts, recentOrders] = await Promise.all([
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
      }),
      prisma.orders.findMany({
        where: { created_at: dateFilter },
        include: {
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
          status: true,
          payment: true
        },
        orderBy: {
          created_at: 'desc'
        },
        take: 10
      })
    ]);

    const statusBreakdown = statusCounts.map(status => ({
      status: status.status_name,
      count: status.orders.length
    }));

    res.json({
      success: true,
      data: {
        period,
        totalOrders,
        totalRevenue: totalRevenue._sum.total_price || 0,
        statusBreakdown,
        recentOrders
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