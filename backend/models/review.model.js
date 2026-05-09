import mongoose from 'mongoose';

import { getVietnamTime } from '../utils/dayjs.js';

const ReviewSchema = new mongoose.Schema({
    review_id: { type: Number, required: true, unique: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    prod_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    approved: { type: Boolean, default: true },
    create_at: { type: Date, default: getVietnamTime },
    update_at: { type: Date }
});

ReviewSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.update_at = getVietnamTime();
    }
    next();
});

const Review = mongoose.model('Review', ReviewSchema);
export default Review;