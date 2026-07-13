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
  clearCache,        // 🟢 NEW: Cache management
  getCacheStats,     // 🟢 NEW: Cache statistics
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
  exportOrdersCSV,   // 🟢 NEW: CSV Export
} from '../controllers/orders.js';
import { authenticate, adminAuth } from '../middleware/auth.js';
import { getNotifications, markNotificationAsRead } from '../controllers/notifications.js'; // ✅ Fixed: Changed .ts to .js
import { auditLogger } from '../middleware/auditLogger.js';

const router = express.Router();

router.use(auditLogger);

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
      products: 'GET /api/products (🟢 Cached)',
      categories: 'GET /api/categories (🟢 Cached)',
      orders: 'POST /api/orders',
      admin: 'GET /api/admin/products',
      export: 'GET /api/admin/orders/export',
      stats: 'GET /api/admin/orders/stats'
    }
  });
});

// ============================================
// PUBLIC ROUTES (WITH CACHING 🟢 TASK 3)
// ============================================
// Products - Cached for 5 minutes
router.get('/products', getProducts);
router.get('/products/:id', getProductById);

// Categories - Cached for 5 minutes
router.get('/categories', getCategories);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================
// Orders - User routes (specific routes first)
router.post('/orders', authenticate, createOrder);
router.get('/orders/my-orders', authenticate, getMyOrders);
router.put('/orders/:id/cancel', authenticate, cancelOrder);
router.get('/orders/customer/:customerId', authenticate, getCustomerOrders);

// Notifications
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

// 🟢 TASK 1: Advanced Statistics
router.get('/admin/orders/stats', adminAuth, getOrderStats);

// 🟢 TASK 2: Export Functionality
router.get('/admin/orders/export', adminAuth, exportOrdersCSV);

// Order Management
router.get('/admin/orders', adminAuth, getAllOrders);
router.patch('/admin/orders/:id/status', adminAuth, updateOrderStatus);

// 🟢 TASK 3: Cache Management (Admin only)
router.delete('/admin/cache', adminAuth, clearCache);
router.get('/admin/cache/stats', adminAuth, getCacheStats);

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
    // Check if route has caching (check if it's products or categories)
    const hasCache = path === '/products' || path === '/categories';
    console.log(`  ${methods} /api${path} ${hasAuth ? '🔒' : '🌐'} ${hasCache ? '🟢 Cached' : ''}`);
  }
});
console.log('');

export default router;