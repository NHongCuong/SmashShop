import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone_number: {
        type: String
    },
    content_message: {
        type: String,
        required: true
    },
    create_at: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model('Message', messageSchema);
