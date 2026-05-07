// const mongoose = require('mongoose');
import mongoose from 'mongoose'
import { getVietnamTime } from '../utils/dayjs.js';

const BrandSchema = new mongoose.Schema({
    brand_id: { type: Number, required: true, unique: true },
    brand_name: { type: String, required: true },
    create_at: { type: Date, default: getVietnamTime },
    update_at: { type: Date }
});

BrandSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.update_at = getVietnamTime();
    }
    next();
});

// module.exports = mongoose.model('Admin', BrandSchema);

const Brand = mongoose.model('Brand', BrandSchema);
export default Brand;
