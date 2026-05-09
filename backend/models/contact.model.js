import mongoose from 'mongoose';
import { getVietnamTime } from '../utils/dayjs.js';

const contactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'processed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: getVietnamTime
    }
});

const Contact = mongoose.model('Contact', contactSchema);
export default Contact;
