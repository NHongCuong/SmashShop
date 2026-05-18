import mongoose from 'mongoose';

const TrafficSchema = new mongoose.Schema({
  date: {
    type: String, // Định dạng YYYY-MM-DD
    required: true,
    unique: true
  },
  count: {
    type: Number,
    default: 0
  }
});

const Traffic = mongoose.model('Traffic', TrafficSchema);

export default Traffic;
