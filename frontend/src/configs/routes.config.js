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
    orderSuccess: "/order-success",
    contact: "/contact",
//Admin
    admin: '/admin',
    adminProducts: '/admin/products',
    adminProductDetail: '/admin/products/:id',
    adminEditProduct: '/admin/products/:id/edit',
    adminAddProduct: '/admin/products/add',
    adminOrders: '/admin/orders',
    adminOrderDetail: '/admin/orders/:id',
    adminContacts: '/admin/contacts',
    adminGeneralImages: '/admin/general-images',
    adminOrderHistory: '/admin/order-history',
};

export default routes;