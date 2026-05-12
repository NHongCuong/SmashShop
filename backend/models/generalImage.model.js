import mongoose from 'mongoose';
import { getVietnamTime } from '../utils/dayjs.js';

const GeneralImageSchema = new mongoose.Schema({
    image_name: { type: String, required: true },
    image: [{ type: String }], // Array of strings (URLs)
    create_at: { type: Date, default: getVietnamTime },
    updated_at: { type: Date, default: null }
}, {
    timestamps: false
});

const GeneralImage = mongoose.model('GeneralImage', GeneralImageSchema);

export default GeneralImage;
