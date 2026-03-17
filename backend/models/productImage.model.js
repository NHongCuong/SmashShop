import mongoose from 'mongoose';

const ProductImageSchema = new mongoose.Schema({
    prod_image_id: { type: Number, required: true, unique: true },
    prod_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    image: { type: String, required: true }, 
    is_primary_image: { type: Boolean, required: true },
});

const ProductImage = mongoose.model('ProductImage', ProductImageSchema);

export default ProductImage;
