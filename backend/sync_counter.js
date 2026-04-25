import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.model.js';
import Counter from './models/counter.model.js';

dotenv.config();

const syncCounter = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const lastUser = await User.findOne().sort({ user_id: -1 });
        const maxId = lastUser ? lastUser.user_id : 0;
        console.log(`Current max user_id in database: ${maxId}`);

        await Counter.findOneAndUpdate(
            { id: 'user_id' },
            { $set: { seq: maxId } },
            { upsert: true, new: true }
        );
        console.log(`Counter 'user_id' synced to: ${maxId}`);

        process.exit(0);
    } catch (err) {
        console.error('Error syncing counter:', err);
        process.exit(1);
    }
};

syncCounter();
