import { prisma } from '../src/db.js';
import bcrypt from 'bcrypt';

async function main() {
  console.log('🌱 Starting Sweet & Savory Bakery seeding...');

 
  // ============================================
  // 1. CREATE USER ROLES
  // ============================================
  console.log('📝 Creating user roles...');
  
  const roleData = [
    { id: 1, role_name: 'Admin' },
    { id: 2, role_name: 'Staff' },
    { id: 3, role_name: 'Customer' }
  ];

  for (const role of roleData) {
    await prisma.userRoles.upsert({
      where: { id: role.id },
      update: { role_name: role.role_name },
      create: role
    });
  }

  const adminRole = { id: 1 };
  const staffRole = { id: 2 };
  const customerRole = { id: 3 };
  
  console.log('✅ User roles created');

  // ============================================
  // 2. CREATE ORDER STATUSES
  // ============================================
  console.log('📝 Creating order statuses...');
  
  const statusData = [
    { id: 1, status_name: 'Unpaid' },
    { id: 2, status_name: 'Pending' },
    { id: 3, status_name: 'Preparing' },
    { id: 4, status_name: 'Ready for Pickup' },
    { id: 5, status_name: 'Out for Delivery' },
    { id: 6, status_name: 'Completed' },
    { id: 7, status_name: 'Cancelled' }
  ];

  for (const status of statusData) {
    await prisma.orderStatuses.upsert({
      where: { id: status.id },
      update: {},
      create: status
    });
  }

  const completedStatus = await prisma.orderStatuses.findFirst({
    where: { status_name: 'Completed' }
  });
  
  console.log('✅ Order statuses created');

  // ============================================
  // 3. CREATE CATEGORIES
  // ============================================
  console.log('📝 Creating categories...');
  
  const categoryData = [
    { category_name: 'Breads' },
    { category_name: 'Pastries' },
    { category_name: 'Cakes' }
  ];

  for (const category of categoryData) {
    await prisma.categories.upsert({
      where: { category_name: category.category_name },
      update: {},
      create: category
    });
  }

  const breadCategory = await prisma.categories.findUnique({
    where: { category_name: 'Breads' }
  });
  const pastryCategory = await prisma.categories.findUnique({
    where: { category_name: 'Pastries' }
  });
  
  console.log('✅ Categories created');

  // ============================================
  // 4. CREATE USERS (3 users)
  // ============================================
  console.log('📝 Creating users...');

  // Admin User
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@bakery.com' },
    update: {},
    create: {
      email: 'admin@bakery.com',
      password: adminPassword,
      role_id: adminRole!.id,
      profile: {
        create: {
          full_name: 'Admin Manager',
          phone: '+251911000001',
          default_address: 'Bole Road, Addis Ababa'
        }
      }
    },
    include: { profile: true }
  });
  console.log(`✅ Created admin: ${adminUser.email}`);

  // Customer User
  const customerPassword = await bcrypt.hash('Customer@123', 10);
  const customerUser = await prisma.users.upsert({
    where: { email: 'customer@example.com' },
    update: {},
    create: {
      email: 'customer@example.com',
      password: customerPassword,
      role_id: customerRole!.id,
      profile: {
        create: {
          full_name: 'John Doe',
          phone: '+251911000002',
          default_address: 'Piassa, Addis Ababa'
        }
      }
    },
    include: { profile: true }
  });
  console.log(`✅ Created customer: ${customerUser.email}`);

  // Staff User
  const staffPassword = await bcrypt.hash('Staff@123', 10);
  const staffUser = await prisma.users.upsert({
    where: { email: 'staff@bakery.com' },
    update: {},
    create: {
      email: 'staff@bakery.com',
      password: staffPassword,
      role_id: staffRole!.id,
      profile: {
        create: {
          full_name: 'Sarah Johnson',
          phone: '+251911000003',
          default_address: 'Meskel Square, Addis Ababa'
        }
      }
    },
    include: { profile: true }
  });
  console.log(`✅ Created staff: ${staffUser.email}`);

  // ============================================
  // 5. CREATE PRODUCTS (2 products)
  // ============================================
  console.log('📝 Creating products...');

  const productData = [
    {
      name: 'Sourdough Bread',
      description: 'Traditional fermented sourdough with crispy crust',
      price: 8.99,
      image_url: 'https://images.unsplash.com/photo-1585478259715-5fd73b2b2679',
      category_id: breadCategory!.id,
      stock_quantity: 25,
      is_available: true
    },
    {
      name: 'Chocolate Croissant',
      description: 'Flaky croissant filled with premium dark chocolate',
      price: 4.99,
      image_url: 'https://images.unsplash.com/photo-1623334044303-241021148842',
      category_id: pastryCategory!.id,
      stock_quantity: 45,
      is_available: true
    }
  ];

  const createdProducts = [];
  for (const product of productData) {
    const createdProduct = await prisma.products.create({
      data: product
    });
    createdProducts.push(createdProduct);
  }
  console.log(`✅ Created ${createdProducts.length} products`);

  // ============================================
  // 6. CREATE ORDERS (2 orders)
  // ============================================
  console.log('📝 Creating orders...');

  // Order 1: Online order with payment
  const order1Items = [
    {
      product_id: createdProducts[0]!.id,
      quantity: 2,
      subtotal: createdProducts[0]!.price.toNumber() * 2
    }
  ];
  const order1Total = order1Items.reduce((sum, item) => sum + item.subtotal, 0);

  const order1 = await prisma.orders.create({
    data: {
      customer_id: customerUser.profile!.id,
      total_price: order1Total,
      order_type: 'Pickup',
      scheduled_for: new Date(Date.now() + 3600000), // 1 hour from now
      status_id: completedStatus!.id,
      orderItems: {
        create: order1Items
      }
    }
  });

  // Payment for order 1
  await prisma.payments.create({
    data: {
      order_id: order1.id,
      amount: order1Total,
      payment_method: 'Chapa',
      payment_status: 'Completed',
      transaction_reference: `CHAPA-${Date.now()}-abc123`,
      paid_at: new Date()
    }
  });

  // Update stock for order 1
  await prisma.products.update({
    where: { id: createdProducts[0]!.id },
    data: {
      stock_quantity: {
        decrement: 2
      }
    }
  });

  // Notification for order 1
  await prisma.notifications.create({
    data: {
      user_id: customerUser.id,
      message: `Order #${order1.id.slice(0, 8)} has been completed.`,
      trigger_type: 'Order_Update'
    }
  });

  console.log(`✅ Created order 1: ${order1.id.slice(0, 8)} ($${order1Total})`);

  // Order 2: Walk-in/Cash order
  const order2Items = [
    {
      product_id: createdProducts[1]!.id,
      quantity: 3,
      subtotal: createdProducts[1]!.price.toNumber() * 3
    }
  ];
  const order2Total = order2Items.reduce((sum, item) => sum + item.subtotal, 0);

  const order2 = await prisma.orders.create({
    data: {
      customer_id: null, // Walk-in customer
      total_price: order2Total,
      order_type: 'Pickup',
      scheduled_for: new Date(),
      status_id: completedStatus!.id,
      orderItems: {
        create: order2Items
      }
    }
  });

  // Payment for order 2 (Cash)
  await prisma.payments.create({
    data: {
      order_id: order2.id,
      amount: order2Total,
      payment_method: 'Cash',
      payment_status: 'Completed',
      paid_at: new Date()
    }
  });

  // Update stock for order 2
  await prisma.products.update({
    where: { id: createdProducts[1]!.id },
    data: {
      stock_quantity: {
        decrement: 3
      }
    }
  });

  console.log(`✅ Created order 2: ${order2.id.slice(0, 8)} ($${order2Total})`);

  // ============================================
  // 7. ADD NOTIFICATIONS (2 notifications)
  // ============================================
  console.log('📝 Creating notifications...');

  const notificationData = [
    {
      user_id: customerUser.id,
      message: 'Your order is ready for pickup!',
      trigger_type: 'Order_Update'
    },
    {
      user_id: adminUser.id,
      message: 'New order placed by John Doe',
      trigger_type: 'Admin_Alert'
    }
  ];

  for (const notification of notificationData) {
    await prisma.notifications.create({
      data: notification
    });
  }
  console.log(`✅ Created ${notificationData.length} notifications`);

  // ============================================
  // 8. RESET AUTOINCREMENT SEQUENCES
  // ============================================
  console.log('🔄 Resetting database sequences...');
  const tables = ['UserRoles', 'OrderStatuses', 'Categories', 'Notifications'];
  for (const table of tables) {
    try {
      const result = await prisma.$queryRawUnsafe<any[]>(`SELECT MAX(id) as max FROM "${table}"`);
      const maxVal = result[0]?.max;
      if (maxVal !== null && maxVal !== undefined) {
        await prisma.$executeRawUnsafe(
          `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), ${maxVal})`
        );
      }
    } catch (err) {
      console.warn(`⚠️ Could not reset sequence for table ${table}:`, err);
    }
  }

  // ============================================
  // 9. SUMMARY
  // ============================================
  console.log('\n🎉 Seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log('  👥 Users: 3 (Admin, Staff, Customer)');
  console.log(`  📦 Products: ${productData.length}`);
  console.log(`  📂 Categories: ${categoryData.length}`);
  console.log('  📋 Orders: 2');
  console.log('  💳 Payments: 2');
  console.log(`  🔔 Notifications: ${notificationData.length}`);

  console.log('\n🔑 Login Credentials:');
  console.log('  Admin:    admin@bakery.com / Admin@123');
  console.log('  Staff:    staff@bakery.com / Staff@123');
  console.log('  Customer: customer@example.com / Customer@123');
}

// Run the seeding
main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });