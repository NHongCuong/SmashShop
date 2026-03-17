import Review from "../models/review.model.js";

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

        // Tạo review_id tự tăng
        const maxReview = await Review.findOne({}).sort({ review_id: -1 });
        const newReviewId = maxReview ? maxReview.review_id + 1 : 1;

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

        // Chỉ cho phép user xóa review của chính mình
        if (review.user_id.toString() !== req.user._id) {
            return res.status(403).json({ success: false, message: "Không có quyền xóa đánh giá này" });
        }

        await Review.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa đánh giá" });
    } catch (e) {
        console.error("Error deleting review:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
