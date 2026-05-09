import Review from "../models/review.model.js";
import { getNextSequenceValue } from "../models/counter.model.js";
import { getVietnamTime } from '../utils/dayjs.js';

// Lấy đánh giá theo sản phẩm
export const getReviewsByProduct = async (req, res) => {
    try {
        const reviews = await Review.find({ prod_id: req.params.productId })
            .populate('user_id', 'name email')
            .sort({ create_at: -1 });
        
        // Tính điểm trung bình
        const totalReviews = reviews.length;
        const avgRating = totalReviews > 0 
            ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
            : 0;

        res.status(200).json({ 
            success: true, 
            data: reviews, 
            avgRating: parseFloat(avgRating),
            totalReviews 
        });
    } catch (e) {
        console.error("Error fetching reviews:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Tạo đánh giá mới
export const createReview = async (req, res) => {
    const { prod_id, rating, comment } = req.body;
    const user_id = req.user._id;

    if (!prod_id || !rating) {
        return res.status(400).json({ success: false, message: "Vui lòng chọn số sao đánh giá" });
    }

    try {
        // Kiểm tra xem user đã đánh giá sản phẩm này chưa
        const existingReview = await Review.findOne({ user_id, prod_id });
        if (existingReview) {
            return res.status(400).json({ success: false, message: "Bạn đã đánh giá sản phẩm này rồi" });
        }

        // Tạo review_id tự tăng bằng Counter để tránh Race Condition
        const newReviewId = await getNextSequenceValue("review_id");

        const review = new Review({
            review_id: newReviewId,
            user_id,
            prod_id,
            rating,
            comment: comment || '',
        });

        await review.save();
        
        // Populate user info trước khi trả về
        const populatedReview = await Review.findById(review._id)
            .populate('user_id', 'name email');

        res.status(201).json({ success: true, data: populatedReview });
    } catch (e) {
        console.error("Error creating review:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Xóa đánh giá
export const deleteReview = async (req, res) => {
    try {
        const review = await Review.findById(req.params.id);
        if (!review) {
            return res.status(404).json({ success: false, message: "Review not found" });
        }

        // Chỉ cho phép user xóa review của chính mình, HOẶC Admin xóa bất kỳ review nào
        if (req.user.role !== 'admin' && review.user_id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: "Không có quyền xóa đánh giá này" });
        }

        await Review.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa đánh giá" });
    } catch (e) {
        console.error("Error deleting review:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Lấy tất cả đánh giá (Admin)
export const fetchAllReviewsAdmin = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const sortBy = req.query.sortBy || 'create_at';
        const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
        const search = req.query.search || '';
        const skip = (page - 1) * limit;

        const sortOptions = { [sortBy]: sortOrder };

        // Xây dựng query tìm kiếm
        let query = {};
        
        // Nếu có search, chúng ta cần populate trước hoặc dùng aggregate để search theo field của model liên kết
        // Ở đây để đơn giản và hiệu quả, chúng ta lấy tất cả ids phù hợp nếu search text khớp user name hoặc product name
        if (search) {
            // Lưu ý: Search phức tạp thì aggregate tốt hơn, 
            // nhưng ở đây ta có thể dùng filter sau khi populate hoặc tìm IDs trước
            // Tuy nhiên để phân trang đúng, ta nên dùng aggregate pipe
        }

        const aggregationPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: '$user' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'prod_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' }
        ];

        if (search) {
            aggregationPipeline.push({
                $match: {
                    $or: [
                        { 'user.name': { $regex: search, $options: 'i' } },
                        { 'product.prod_name': { $regex: search, $options: 'i' } }
                    ]
                }
            });
        }

        // Đếm tổng số để tính totalPages
        const countPipeline = [...aggregationPipeline, { $count: 'total' }];
        const countResult = await Review.aggregate(countPipeline);
        const totalItems = countResult.length > 0 ? countResult[0].total : 0;
        const totalPages = Math.ceil(totalItems / limit);

        // Lấy dữ liệu với phân trang và sắp xếp
        aggregationPipeline.push(
            { $sort: sortOptions },
            { $skip: skip },
            { $limit: limit }
        );

        const reviews = await Review.aggregate(aggregationPipeline);

        res.status(200).json({
            success: true,
            data: reviews,
            page,
            limit,
            totalPages,
            totalItems
        });
    } catch (e) {
        console.error("Error in fetchAllReviewsAdmin:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Cập nhật đánh giá (Admin)
export const updateReviewAdmin = async (req, res) => {
    try {
        const { rating, comment } = req.body;
        const review = await Review.findByIdAndUpdate(
            req.params.id,
            { rating, comment, update_at: getVietnamTime() },
            { new: true }
        ).populate('user_id', 'name').populate('prod_id', 'prod_name');

        if (!review) {
            return res.status(404).json({ success: false, message: "Không tìm thấy đánh giá" });
        }

        res.status(200).json({ success: true, data: review });
    } catch (e) {
        console.error("Error in updateReviewAdmin:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
