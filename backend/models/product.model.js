import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    prod_id: { type: Number, required: true, unique: true },
    prod_name: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true },
    quantity_sold: {type: Number, required: true},
    description: { type: String },
    category_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
    brand_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Brand' },
    type_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Type' },
    discount: { type: Number },
    is_active: { type: Boolean, default: true },
    create_at: { type: Date, default: Date.now },
    update_at: { type: Date }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  });
// tạo virtual field
ProductSchema.virtual('images', {
    ref: 'ProductImage',
    localField: '_id',
    foreignField: 'prod_id',
  });
const Product = mongoose.model('Product', ProductSchema);

export default Product;