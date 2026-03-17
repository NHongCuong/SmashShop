import mongoose from 'mongoose';

const TypeSchema = new mongoose.Schema({
    type_id: { type: Number, required: true, unique: true },
    type_name: { type: String, required: true }
});

const Type = mongoose.model('Type', TypeSchema);
export default Type;
