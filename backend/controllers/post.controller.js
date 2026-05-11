import Post from "../models/post.model.js";
import Category from "../models/category.model.js";
import User from "../models/user.model.js";
import asyncHandler from "express-async-handler";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const generateAIPostContent = async (post_title, section_headling) => {
  const instruction = `You are an AI specializing in writing blog post sections for a badminton shop website called HC SHOP. 
  Your task is to generate engaging, informative, and detailed content for a specific section of a blog post.
  Response in Vietnamese and markdown format. No title, just the content body.
  `;
  const prompt = `Write a detailed content for a blog post titled "${post_title}" under the specific heading "${section_headling}".`;

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2000,
      },
      systemInstruction: instruction,
    });
    return result.response.text();
  } catch (error) {
    console.error("AI Generation Error:", error.message);
    return `(Lỗi AI: ${error.message})`;
  }
}


// Utility: generate slug from title (max 80 chars)
const generateSlug = (text) => {
  if (!text) return "";
  const vietnameseMap = {
    à: "a", á: "a", ả: "a", ã: "a", ạ: "a",
    ă: "a", ắ: "a", ằ: "a", ẳ: "a", ẵ: "a", ặ: "a",
    â: "a", ấ: "a", ầ: "a", ẩ: "a", ẫ: "a", ậ: "a",
    è: "e", é: "e", ẻ: "e", ẽ: "e", ẹ: "e",
    ê: "e", ế: "e", ề: "e", ể: "e", ễ: "e", ệ: "e",
    ì: "i", í: "i", ỉ: "i", ĩ: "i", ị: "i",
    ò: "o", ó: "o", ỏ: "o", õ: "o", ọ: "o",
    ô: "o", ố: "o", ồ: "o", ổ: "o", ỗ: "o", ộ: "o",
    ơ: "o", ớ: "o", ờ: "o", ở: "o", ỡ: "o", ợ: "o",
    ù: "u", ú: "u", ủ: "u", ũ: "u", ụ: "u",
    ư: "u", ứ: "u", ừ: "u", ử: "u", ữ: "u", ự: "u",
    ỳ: "y", ý: "y", ỷ: "y", ỹ: "y", ỵ: "y",
    đ: "d",
  };
  return text
    .toLowerCase()
    .replace(/[àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ]/g,
      (c) => vietnameseMap[c] || c)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .substring(0, 80);
};

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

// Get single post by ID or post_url (slug)
export const getPostById = asyncHandler(async (req, res) => {
  const param = req.params.id;

  // Try to find by _id first (24-char hex), else find by post_url
  let post = null;
  if (/^[a-f\d]{24}$/i.test(param)) {
    post = await Post.findById(param)
      .populate("category_id", "category_name")
      .populate("user_id", "name");
  }

  // If not found by _id, try post_url
  if (!post) {
    post = await Post.findOne({ post_url: param })
      .populate("category_id", "category_name")
      .populate("user_id", "name");
  }

  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }
  res.status(200).json(post);
});

// Create post
export const createPost = asyncHandler(async (req, res) => {
  const { title, post_url, images, total_content, category_id, user_id } = req.body;

  // Auto-generate post_url from title if not provided
  const slug = post_url?.trim() || generateSlug(title);

  // Ensure slug uniqueness
  let finalSlug = slug;
  const existing = await Post.findOne({ post_url: slug });
  if (existing) {
    finalSlug = `${slug}-${Date.now().toString().slice(-4)}`;
  }

  // Handle AI Content Generation
  const processedContent = await Promise.all((total_content || []).map(async (section) => {
    if (section.content === "Using AI") {
      section.content = await generateAIPostContent(title, section.headling);
    }
    return section;
  }));

  const post = await Post.create({
    title,
    post_url: finalSlug,
    images,
    total_content: processedContent,
    category_id,
    user_id: user_id || req.user._id,
  });

  res.status(201).json(post);
});

// Update post
export const updatePost = asyncHandler(async (req, res) => {
  const { title, post_url, images, total_content, category_id, user_id } = req.body;

  const post = await Post.findById(req.params.id);
  if (!post) {
    res.status(404);
    throw new Error("Post not found");
  }

  if (title) post.title = title;
  if (images) post.images = images;
  
  if (total_content) {
    // Handle AI Content Generation for Update
    post.total_content = await Promise.all(total_content.map(async (section) => {
      if (section.content === "Using AI") {
        section.content = await generateAIPostContent(title || post.title, section.headling);
      }
      return section;
    }));
  }

  if (category_id) post.category_id = category_id;
  if (user_id) post.user_id = user_id;

  // Update post_url if explicitly provided, else keep existing or regenerate
  if (post_url !== undefined && post_url !== null) {
    const newSlug = post_url.trim() || generateSlug(title || post.title);
    // Check uniqueness (allow keeping same slug)
    const conflict = await Post.findOne({ post_url: newSlug, _id: { $ne: post._id } });
    if (!conflict) {
      post.post_url = newSlug;
    }
  }

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
  const postsData = req.body;

  // Auto-generate post_url for each post
  const enriched = await Promise.all(postsData.map(async (item) => {
    if (!item.post_url) {
      const slug = generateSlug(item.title || "");
      const existing = await Post.findOne({ post_url: slug });
      item.post_url = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;
    }
    return item;
  }));

  const createdPosts = await Post.insertMany(enriched, { ordered: false });
  res.status(201).json(createdPosts);
});
