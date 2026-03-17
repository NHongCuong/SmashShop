import routes from '../configs/routes.config';
import Home from '../pages/Home/Home';
import Login from '../pages/Login/Login';
import Register from '../pages/Register/Register';
import User from '../pages/User/User';
import Profile from '../pages/User/Profile/Profile';
import OrdersHistory from '../pages/User/OrderHistory/OrdersHistory';
import ResetPassword from '../pages/User/ResetPassword/ResetPassword';
import Products from '../pages/Products/Products';
import ProductDetail from '../pages/ProductDetail/ProductDetail';
import Cart from '../pages/Cart/Cart';
import Order from '../pages/Order/Order';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';
import AdminProducts from '../pages/Admin/AdminProducts/AdminProducts';
import AdminEditProduct from '../pages/Admin/AdminEditProduct';
import AdminAddProduct from '../pages/Admin/AdminAddProduct';
import AdminOrders from '../pages/Admin/AdminOrders/AdminOrders';
import AdminStatistics from '../pages/Admin/AdminStatistics/AdminStatistics';
import AdminProductDetail from '../pages/Admin/AdminProductDetail/AdminProductDetail';
import AdminOrderDetail from '../pages/Admin/AdminOrderDetail/AdminOrderDetail';
import AdminLogin from '../pages/Admin/AdminLogin/AdminLogin';
import RequireAdminAuth from '../pages/Admin/AdminLogin/RequireAdminAuth';
import RequireUserAuth from '../pages/User/RequireUserAuth';


import { Navigate } from "react-router-dom";
import PaymentSuccess from '../pages/Payment/Payment';

const pages = [
    { path: routes.home, Component: Home },
    { path: routes.login, Component: Login },
    { path: routes.register, Component: Register },
    { path: routes.products, Component: Products },
    { path: routes.product, Component: ProductDetail },
    { path: routes.cart, Component: Cart },
    { path: routes.order, Component: Order },
    { path: routes.paymentSuccess, Component: PaymentSuccess },
    { path: `${routes.products}/:category`, Component: Products },
    { 
        path: routes.user,
        Component: () => (
          <RequireUserAuth>
            <User />
          </RequireUserAuth>
        ),
        children: [
            { path: "", Component: () => <Navigate to="/user/profile" replace /> }, 
            { path: "profile", Component: Profile },
            { path: "orders", Component: OrdersHistory },
            { path: "reset-password", Component: ResetPassword },
        ]
    },
    {
        path: routes.admin,
        Component: () => (
            <RequireAdminAuth>
            <AdminDashboard />
            </RequireAdminAuth>
        ),
        children: [
            { path: '', Component: AdminStatistics },
            { path: 'products', Component: AdminProducts },
            { path: 'products/add', Component: AdminAddProduct },
            { path: 'products/:id', Component: AdminProductDetail },
            { path: 'products/edit/:id', Component: AdminEditProduct },
            { path: 'orders', Component: AdminOrders },
            { path: 'orders/:id', Component: AdminOrderDetail },

        ],
    },
    { path: 'admin-login', Component: AdminLogin },
];

export default pages;