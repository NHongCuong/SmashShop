import Post from "../models/post.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";

// Get all posts with filtering, sorting, pagination
export const getPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, sort = "latest", search = "", categoryId = "" } = req.query;

  const query = {};
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
    ];
  }
  if (categoryId) {
    query.category_id = categoryId;
  }

  let sortQuery = { createdAt: -1 };
  if (sort === "oldest") sortQuery = { createdAt: 1 };
  if (sort === "a-z") sortQuery = { title: 1 };
  if (sort === "z-a") sortQuery = { title: -1 };

  const posts = await Post.find(query)
    .populate("category_id", "category_name")
    .populate("user_id", "name")
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Post.countDocuments(query);

  res.status(200).json({
    posts,
    totalPages: Math.ceil(total / limit),
    currentPage: parseInt(page),
    totalPosts: total,
  });
});

// Get single post
export const getPostById = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate("category_id", "category_name")
    .populate("user_id", "name");
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  res.status(200).json(post);
});

// Create post
export const createPost = asyncHandler(async (req, res) => {
  const { title, images, total_content, category_id, user_id } = req.body;

  const post = await Post.create({
    title,
    images,
    total_content,
    category_id,
    user_id: user_id || req.user._id,
  });

  res.status(201).json(post);
});

// Update post
export const updatePost = asyncHandler(async (req, res) => {
  const { title, images, total_content, category_id, user_id } = req.body;

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  post.title = title || post.title;
  post.images = images || post.images;
  post.total_content = total_content || post.total_content;
  post.category_id = category_id || post.category_id;
  post.user_id = user_id || post.user_id;

  const updatedPost = await post.save();
  res.status(200).json(updatedPost);
});

// Delete post
export const deletePost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  await post.deleteOne();
  res.status(200).json({ message: "Post removed" });
});

// Import posts from JSON/Array (helper for frontend excel import)
export const importPosts = asyncHandler(async (req, res) => {
  const postsData = req.body; // Expecting array of objects

  // Map category names to IDs and User names to IDs if needed
  // For simplicity, we assume frontend sends IDs or we do a lookup
  // This is a bulk operation
  const createdPosts = await Post.insertMany(postsData);
  res.status(201).json(createdPosts);
});
