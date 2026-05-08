import mongoose from 'mongoose'
import { getVietnamTime } from '../utils/dayjs.js';

const VoucherSchema = new mongoose.Schema({
    voucher_id: { type: Number, required: true, unique: true },
    voucher_name: { type: String, required: true },
    discount_percent: { type: Number, required: true, min: 0, max: 100 },
    create_at: { type: Date, default: getVietnamTime },
    update_at: { type: Date }
});

VoucherSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.update_at = getVietnamTime();
    }
    next();
});

const Voucher = mongoose.model('Voucher', VoucherSchema);
export default Voucher;
