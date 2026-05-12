import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { getVietnamTime } from '../utils/dayjs.js';

const CategorySchema = new mongoose.Schema({
    category_id: { type: Number, required: true, unique: true },
    category_name: { type: String, required: true },
    image: { type: String }, // Lưu URL ảnh từ Cloudinary
    featured_category: { type: String, default: '' }, // Nhãn danh mục nổi bật
    create_at: { type: Date, default: getVietnamTime },
    update_at: { type: Date }
});

CategorySchema.pre('save', function (next) {
    if (!this.isNew) {
        this.update_at = getVietnamTime();
    }
    next();
});

const Category = mongoose.model('Category', CategorySchema);
export default Category;
