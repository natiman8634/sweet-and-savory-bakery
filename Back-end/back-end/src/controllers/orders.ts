import type { Request, Response } from 'express';
import prisma from '../lib/prisma.js'; 

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

interface OrderInput {
  customer_id: string;
  items: OrderItemInput[];
  order_type: string;
  scheduled_for?: string;
  payment_method: string;
}

export const createOrder = async (req: Request, res: Response) => {
  try {
    const {
      customer_id,
      items,
      order_type,
      scheduled_for,
      payment_method,
    } = req.body as OrderInput;

    // Validate required fields
    if (!customer_id || !items || !items.length || !order_type || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: customer_id, items, order_type, and payment_method are required',
      });
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Validate stock availability and calculate total
      let totalPrice = 0;
      const validatedItems = await Promise.all(
        items.map(async (item) => {
          const product = await tx.products.findUnique({
            where: { id: item.product_id },
            select: {
              id: true,
              name: true,
              price: true,
              stock_quantity: true,
            },
          });

          if (!product) {
            throw new Error(`Product with ID ${item.product_id} not found`);
          }

          if (product.stock_quantity < item.quantity) {
            throw new Error(
              `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}`
            );
          }

          const subtotal = Number(product.price) * item.quantity;
          totalPrice += subtotal;

          return {
            ...item,
            product,
            subtotal,
          };
        })
      );

      // Step 2: Create the order
      const order = await tx.orders.create({
        data: {
          customer_id: customer_id,
          total_price: totalPrice,
          order_type: order_type,
          scheduled_for: scheduled_for ? new Date(scheduled_for) : new Date(),
          status_id: 1, // 1 = 'pending'
          orderItems: {
            create: validatedItems.map((item) => ({
              product_id: item.product_id,
              quantity: item.quantity,
              subtotal: item.subtotal,
            })),
          },
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          status: true,
          customer: true,
        },
      });

      // Step 3: Deduct stock for each item
      await Promise.all(
        validatedItems.map(async (item) => {
          await tx.products.update({
            where: { id: item.product_id },
            data: {
              stock_quantity: {
                decrement: item.quantity,
              },
            },
          });
        })
      );

      // Step 4: Mock Payment Processing
      const payment = await tx.payments.create({
        data: {
          order_id: order.id,
          amount: totalPrice,
          payment_method: payment_method,
          payment_status: 'completed', // Mock - automatically completed
          transaction_reference: `MOCK-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          paid_at: new Date(),
        },
      });

      // Step 5: Update order status to 'completed' (status_id = 2)
      const updatedOrder = await tx.orders.update({
        where: { id: order.id },
        data: {
          status_id: 2, // 2 = 'completed'
        },
        include: {
          orderItems: {
            include: {
              product: true,
            },
          },
          status: true,
          customer: true,
          payment: true,
        },
      });

      return updatedOrder;
    });

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: result,
      mock_payment: true,
      note: 'Payment was automatically marked as completed for testing purposes',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    
    if (error instanceof Error && error.message.includes('Insufficient stock')) {
      return res.status(400).json({
        success: false,
        message: error.message,
        error: 'INSUFFICIENT_STOCK',
      });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        message: error.message,
        error: 'PRODUCT_NOT_FOUND',
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to create order',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};


export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Ensure id is a string
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
          select: {
            id: true,
            full_name: true,
            phone: true,
            default_address: true,
          },
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

export const getCustomerOrders = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const { limit = 10, offset = 0, status } = req.query;

    //  Ensure customerId is a string
    const customerIdStr = typeof customerId === 'string' ? customerId : String(customerId);

    if (!customerIdStr) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID',
      });
    }

    const where: any = {
      customer_id: customerIdStr,
    };

    // If status filter is provided
    if (status) {
      // Map status string to status_id
      const statusMap: Record<string, number> = {
        'pending': 1,
        'completed': 2,
        'cancelled': 3,
        'processing': 4,
      };
      where.status_id = statusMap[status as string] || Number(status);
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


export const cancelOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    //  Ensure id is a string
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
        status: {
          select: {
            id: true,
            status_name: true,
          },
        },
        orderItems: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    // Access status_name through the status relation
    const statusName = order.status?.status_name || 'unknown';

    // Check if order is pending (status_id = 1)
    if (order.status_id !== 1) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel order with status: ${statusName}`,
      });
    }

    // In a real implementation, you would restore stock here
    const canceledOrder = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status_id: 3, // 3 = 'cancelled'
      },
      include: {
        status: {
          select: {
            id: true,
            status_name: true,
          },
        },
        customer: {
          select: {
            id: true,
            full_name: true,
            phone: true,
          },
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    res.json({
      success: true,
      message: 'Order cancelled successfully',
      data: canceledOrder,
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