import mongoose from "mongoose";

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    post_url: {
      type: String,
      trim: true,
      unique: true,
      sparse: true, // allow null/undefined for multiple docs
    },
    images: {
      type: [String], // Array of image URLs
      default: [],
    },
    total_content: [
      {
        headling: { type: String, trim: true },
        content: { type: String },
        create_table: { type: String, default: '' }, // HTML table string
      },
    ],
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const Post = mongoose.model("Post", PostSchema);
export default Post;
