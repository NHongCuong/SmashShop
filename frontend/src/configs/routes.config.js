import products from "../data/products";

const routes = {
    home: '/',
    user: '/user',
    register: '/register',
    login: '/login',
    products: '/products',
    product: '/product/:id',
    cart: '/cart',
    order: '/order',
    paymentSuccess: "/payment-success",
//Admin
    admin: '/admin',
    adminProducts: '/admin/products',
    adminProductDetail: '/admin/products/:id',
    adminEditProduct: '/admin/products/:id/edit',
    adminAddProduct: '/admin/products/add',
    adminOrders: '/admin/orders',
    adminOrderDetail: '/admin/orders/:id',


};

export default routes;