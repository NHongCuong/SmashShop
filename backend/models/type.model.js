import mongoose from 'mongoose';
import { getVietnamTime } from '../utils/dayjs.js';

const TypeSchema = new mongoose.Schema({
    type_id: { type: Number, required: true, unique: true },
    type_name: { type: String, required: true },
    create_at: { type: Date, default: getVietnamTime },
    update_at: { type: Date }
});

TypeSchema.pre('save', function (next) {
    if (!this.isNew) {
        this.update_at = getVietnamTime();
    }
    next();
});

const Type = mongoose.model('Type', TypeSchema);
export default Type;
