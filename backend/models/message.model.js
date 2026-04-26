import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    roomId: { type: String, required: true, index: true },
    msgId: { type: String },
    fromId: { type: String, required: true },
    fromName: { type: String, required: true },
    email: { type: String, required: true },
    phone_number: { type: String },
    email_customer: { type: String },
    phone_customer: { type: String },
    fromRole: { type: String, required: true },
    message: { type: String, required: true },
    replyTo: { type: mongoose.Schema.Types.Mixed, default: null },
    avatar: { type: String },
    reactions: { type: Map, of: String, default: {} },
    isRecalled: { type: Boolean, default: false },
    create_at: { type: Date, default: Date.now }
});

export default mongoose.model('Message', messageSchema);
