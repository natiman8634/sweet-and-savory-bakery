import { createBrowserRouter } from 'react-router-dom';
// import RootLayout from '../layouts/RootLayout';
// import Home from '../pages/Home';
// import Login from '../pages/Login';
// import Register from '../pages/Register';
// import Products from '../pages/Products';
// import ProductDetail from '../pages/ProductDetail';
// import Cart from '../pages/Cart';
// import Checkout from '../pages/Checkout';
// import Orders from '../pages/Orders';
// import OrderDetail from '../pages/OrderDetail';
// import Profile from '../pages/Profile';
// import AdminDashboard from '../pages/admin/AdminDashboard';
// import AdminOrders from '../pages/admin/AdminOrders';
// import AdminProducts from '../pages/admin/AdminProducts';
// import AdminUsers from '../pages/admin/AdminUsers';
// import ProtectedRoute from '../components/auth/ProtectedRoute';
// import AdminRoute from '../components/auth/AdminRoute';

export const router = createBrowserRouter([
//   {
//     path: '/',
//     element: <RootLayout />,
//     children: [
//       { index: true, element: <Home /> },
//       { path: 'products', element: <Products /> },
//       { path: 'products/:id', element: <ProductDetail /> },
//       { path: 'cart', element: <Cart /> },
//       {
//         path: 'checkout',
//         element: (
//           <ProtectedRoute>
//             <Checkout />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: 'orders',
//         element: (
//           <ProtectedRoute>
//             <Orders />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: 'orders/:id',
//         element: (
//           <ProtectedRoute>
//             <OrderDetail />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: 'profile',
//         element: (
//           <ProtectedRoute>
//             <Profile />
//           </ProtectedRoute>
//         ),
//       },
//       {
//         path: 'admin',
//         element: (
//           <AdminRoute>
//             <AdminDashboard />
//           </AdminRoute>
//         ),
//         children: [
//           { path: 'orders', element: <AdminOrders /> },
//           { path: 'products', element: <AdminProducts /> },
//           { path: 'users', element: <AdminUsers /> },
//         ],
//       },
//     ],
//   },
//   { path: '/login', element: <Login /> },
//   { path: '/register', element: <Register /> },
]);