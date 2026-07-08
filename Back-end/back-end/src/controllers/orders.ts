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

    // FIX: Fetch the profile ID that links to the Orders table
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
 * Get orders for the authenticated customer
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

    const customerProfile = await prisma.customerProfiles.findFirst({
      where: { user_id: userId }
    });

    const where: any = customerProfile
      ? { customer_id: customerProfile.id }
      : { customer_id: userId };

    const orders = await prisma.orders.findMany({
      where,
      include: {
        status: true,
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
        }
      },
      orderBy: { created_at: 'desc' }
    });

    res.json({
      success: true,
      data: orders,
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

/**
 * Get all orders for admins
 */
export const getAllOrders = async (req: AuthRequest, res: Response) => {
  try {
    const { limit = 10, offset = 0, status } = req.query;

    const where: any = {};

    if (status) {
      const statusMap: Record<string, number> = {
        pending: 1,
        processing: 2,
        preparing: 3,
        ready: 4,
        completed: 5,
        cancelled: 6,
        unpaid: 7,
      };

      const statusId = statusMap[String(status).toLowerCase()];
      if (statusId) {
        where.status_id = statusId;
      }
    }

    const orders = await prisma.orders.findMany({
      where,
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, email: true }
            }
          }
        },
        status: true,
        orderItems: true,
      },
      orderBy: { created_at: 'desc' },
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
            user: {
              select: { id: true, email: true }
            }
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

    // 1. Fetch order and include status
    const order = await prisma.orders.findUnique({
      where: { id: id as string },
      include: { orderItems: true, status: true }
    });

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // 2. Fetch the profile to verify ownership (Mismatched IDs fix)
    const profile = await prisma.customerProfiles.findUnique({
      where: { user_id: userId }
    });

    const isAdmin = req.user?.role?.role_name === 'Admin';
    const isOwner = profile && order.customer_id === profile.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ success: false, message: 'You do not have permission to cancel this order' });
    }

    // 3. Check status
    const cancellableStatuses = ['Pending', 'Unpaid', 'Preparing'];
    if (!cancellableStatuses.includes(order.status.status_name)) {
      return res.status(400).json({ success: false, message: `Cannot cancel in "${order.status.status_name}"` });
    }

    const cancelledStatus = await prisma.orderStatuses.findFirst({ where: { status_name: 'Cancelled' } });
    if (!cancelledStatus) throw new Error('Status "Cancelled" not found');

    // 4. Perform transaction
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

      // 5. Create Notification using the USER_ID (required by model)
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