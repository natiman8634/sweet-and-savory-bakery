import express from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
  getAllProductsAdmin,
  updateProduct,
  toggleProductAvailability,
  bulkUpdateProducts,
  getLowStockProducts,
  createProduct,
  deleteProduct,
} from '../controllers/products.js';
import {
  createOrder,
  getOrderById,
  getCustomerOrders,
  getMyOrders,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  getOrderStats, 
} from '../controllers/orders.js';
import { authenticate, adminAuth } from '../middleware/auth.js';
import { getNotifications, markNotificationAsRead } from '../controllers/notifications.ts';

const router = express.Router();

// ============================================
// TEST ROUTE
// ============================================
router.get('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({
    success: true,
    message: 'Store router is working!',
    routes: {
      test: 'GET /api/test',
      products: 'GET /api/products',
      categories: 'GET /api/categories',
      orders: 'POST /api/orders',
      admin: 'GET /api/admin/products'
    }
  });
});

// ============================================
// PUBLIC ROUTES
// ============================================
// Products
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Categories
router.get('/categories', getCategories);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================
// Orders - User routes (specific routes first)
router.post('/orders', authenticate, createOrder);
router.get('/orders/my-orders', authenticate, getMyOrders);
router.put('/orders/:id/cancel', authenticate, cancelOrder);
router.get('/orders/customer/:customerId', authenticate, getCustomerOrders);
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationAsRead);

// ⚠️ IMPORTANT: This must come LAST to avoid conflict with /my-orders and /customer/:customerId
router.get('/orders/:id', authenticate, getOrderById);

// ============================================
// ADMIN ONLY ROUTES
// ============================================
// Product Management
router.get('/admin/products', adminAuth, getAllProductsAdmin);
router.post('/admin/products', adminAuth, createProduct);
router.patch('/admin/products/:id', adminAuth, updateProduct);
router.delete('/admin/products/:id', adminAuth, deleteProduct);
router.patch('/admin/products/:id/toggle-availability', adminAuth, toggleProductAvailability);
router.post('/admin/products/bulk-update', adminAuth, bulkUpdateProducts);
router.get('/admin/products/low-stock/report', adminAuth, getLowStockProducts);

// Order Management (Admin only)
router.get('/admin/orders', adminAuth, getAllOrders);
router.patch('/admin/orders/:id/status', adminAuth, updateOrderStatus); // ✅ Only admin can update status
router.get('/admin/orders/stats', adminAuth, getOrderStats);

// ============================================
// DEBUG: Log routes when router is created
// ============================================
console.log('\n🔄 Store Router created with routes:');
router.stack.forEach((layer: any) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    const path = layer.route.path;
    // Check if route has middleware (authentication)
    const hasAuth = layer.route.stack.some((s: any) => 
      s.handle?.name === 'authenticate' || s.handle?.name === 'adminAuth'
    );
    console.log(`  ${methods} /api${path} ${hasAuth ? '🔒' : '🌐'}`);
  }
});
console.log('');

export default router;