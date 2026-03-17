import mongoose from 'mongoose';

const Admin = require('./admin.model');
const User = require('./user.model');
const Product = require('./product.model');
const ProductImage = require('./productImage.model');
const Brand = require('./brand.model');
const Type = require('./type.model');
const Category = require('./category.model');
const Order = require('./order.model');
const OrderDetail = require('./orderDetail.model');
const Wishlist = require('./wishlist.model');
const Review = require('./review.model');

exports = {
    Admin,
    User,
    Product,
    ProductImage,
    Brand,
    Type,
    Category,
    Order,
    OrderDetail,
    Wishlist,
    Review
};
