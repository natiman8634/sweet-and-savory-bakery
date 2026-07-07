import express from 'express';
import {
  getProducts,
  getCategories,
  getProductById,
} from '../controllers/products.js';
import {
  createOrder,
  getOrderById,
  getCustomerOrders,
  cancelOrder,
} from '../controllers/orders.js';

const router = express.Router();

//  TEST ROUTE
router.get('/test', (req, res) => {
  console.log('✅ Test route hit!');
  res.json({
    success: true,
    message: 'Store router is working!',
    routes: {
      test: 'GET /api/test',
      products: 'GET /api/products',
      categories: 'GET /api/categories',
      orders: 'POST /api/orders'
    }
  });
});

// ============================================================
// PRODUCT ROUTES
// ============================================================

router.get('/products', getProducts);
router.get('/products/:id', getProductById);
router.get('/categories', getCategories);

// ============================================================
// ORDER ROUTES
// ============================================================

router.post('/orders', createOrder);
router.get('/orders/:id', getOrderById);
router.get('/orders/customer/:customerId', getCustomerOrders);
router.put('/orders/:id/cancel', cancelOrder);

//  Debug: Log routes when router is created
console.log('\n🔄 Store Router created with routes:');
router.stack.forEach((layer: any) => {
  if (layer.route) {
    const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
    console.log(`  ${methods} /api${layer.route.path}`);
  }
});
console.log('');

export default router;