import express from 'express';
import { validate } from '../middleware/validate.js';
import { orderSchema, profileSchema } from '../utils/validators.js';
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
  clearCache,
  getCacheStats,
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
  exportOrdersCSV,
  getDashboardData,
  createGuestOrder,  // 🟢 NEW: Task 1 - Dashboard
} from '../controllers/orders.js';
import {
  createReview,
  getProductReviews,
  getMyReviews,
  deleteReview,
} from '../controllers/reviews.js';  // 🟢 NEW: Task 2 - Reviews
import { authenticate, adminAuth, staffAuth } from '../middleware/auth.js';
import { getNotifications, markNotificationAsRead } from '../controllers/notifications.js';
import { auditLogger } from '../middleware/auditLogger.js';
import {
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers,
  updateUserRole,
  createStaff,
  resetUserPassword,
  deleteUser
} from '../controllers/users.js';
import { sensitiveLimiter } from '../middleware/rateLimiter.js';
import { cacheMiddleware } from '../middleware/cache.js';

const router = express.Router();

// Apply audit logger to all routes
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
      'my-orders': 'GET /api/orders/my-orders (🟢 Pagination)',
      dashboard: 'GET /api/admin/dashboard (📊 Dashboard)',
      reviews: 'GET /api/products/:id/reviews (⭐ Reviews)',
      admin: 'GET /api/admin/products',
      'admin-orders': 'GET /api/admin/orders (🟢 Pagination + Search)',
      export: 'GET /api/admin/orders/export',
      stats: 'GET /api/admin/orders/stats'
    }
  });
});

// ============================================
// PUBLIC ROUTES (WITH CACHING 🟢 TASK 3)
// ============================================
// Products - Cached for 5 minutes
router.get('/products', cacheMiddleware(300), getProducts); router.get('/products/:id', getProductById);

// Categories - Cached for 5 minutes
router.get('/categories', cacheMiddleware(300), getCategories);
// 🟢 TASK 2: Get product reviews (Public)
router.get('/products/:id/reviews', getProductReviews);

// ============================================
// PROTECTED ROUTES (Authentication Required)
// ============================================
// Orders - User routes (specific routes first)
router.post('/orders', authenticate, sensitiveLimiter, validate(orderSchema), createOrder);
router.post('/orders/guest', createGuestOrder);


// GET /api/orders/my-orders?page=1&limit=10&status=Pending
router.get('/orders/my-orders', authenticate, getMyOrders);

router.put('/orders/:id/cancel', authenticate, cancelOrder);
router.get('/orders/customer/:customerId', authenticate, getCustomerOrders);

// 🟢 TASK 2: Review routes (Authenticated)
router.post('/products/:id/reviews', authenticate, createReview);
router.get('/reviews/my-reviews', authenticate, getMyReviews);
router.delete('/reviews/:id', authenticate, deleteReview);

// Notifications
router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/read', authenticate, markNotificationAsRead);

// ⚠️ IMPORTANT: This must come LAST to avoid conflict with /my-orders and /customer/:customerId
router.get('/orders/:id', authenticate, getOrderById);

// ============================================
// ADMIN ONLY ROUTES
// ============================================
router.get('/admin/users', adminAuth, getAllUsers);
router.post('/admin/users/staff', adminAuth, createStaff);
router.patch('/admin/users/:id/role', adminAuth, updateUserRole);
router.patch('/admin/users/:id/reset-password', adminAuth, resetUserPassword);
router.delete('/admin/users/:id', adminAuth, deleteUser);

// Product Management — catalog reads and stock updates are open to Staff too
router.get('/admin/products', staffAuth, getAllProductsAdmin);
router.post('/admin/products', adminAuth, createProduct);
router.patch('/admin/products/:id', staffAuth, updateProduct);
router.delete('/admin/products/:id', adminAuth, deleteProduct);
router.patch('/admin/products/:id/toggle-availability', staffAuth, toggleProductAvailability);
router.post('/admin/products/bulk-update', adminAuth, bulkUpdateProducts);
router.get('/admin/products/low-stock/report', staffAuth, getLowStockProducts);

// 🟢 TASK 1: Advanced Sales Dashboard
router.get('/admin/dashboard', staffAuth, getDashboardData);

// 🟢 TASK 9 & 10: Admin orders with pagination and search
// GET /api/admin/orders?page=1&limit=20&search=John&status=Pending&date=2026-07-09
router.get('/admin/orders', staffAuth, getAllOrders);

router.patch('/admin/orders/:id/status', staffAuth, updateOrderStatus);

// 🟢 TASK 1: Advanced Statistics
router.get('/admin/orders/stats', staffAuth, getOrderStats);

// 🟢 TASK 2: Export Functionality
router.get('/admin/orders/export', staffAuth, exportOrdersCSV);

// 🟢 TASK 3: Cache Management (Admin only)
router.delete('/admin/cache', adminAuth, clearCache);
router.get('/admin/cache/stats', adminAuth, getCacheStats);
router.get('/users/profile', authenticate, getProfile);
router.put('/users/profile', authenticate, validate(profileSchema), updateProfile);
router.patch('/users/change-password', authenticate, changePassword);
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
    // Check if route has caching
    const hasCache = layer.route.stack.some((s: any) => s.handle?.name === 'cacheMiddleware');
    // Check if route has pagination
    const hasPagination = path === '/orders/my-orders' || path === '/admin/orders';
    // Check if route has search
    const hasSearch = path === '/admin/orders';
    // Check if route is dashboard
    const isDashboard = path === '/admin/dashboard';
    // Check if route is reviews
    const isReviews = path === '/products/:id/reviews' || path === '/reviews/my-reviews';

    console.log(`  ${methods} /api${path} ${hasAuth ? '🔒' : '🌐'} ${hasCache ? '🟢 Cached' : ''} ${hasPagination ? '📄 Pagination' : ''} ${hasSearch ? '🔍 Search' : ''} ${isDashboard ? '📊 Dashboard' : ''} ${isReviews ? '⭐ Reviews' : ''}`);
  }
});
console.log('');

export default router;