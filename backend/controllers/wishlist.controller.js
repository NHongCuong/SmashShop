import Wishlist from "../models/whishlist.model.js";

// Lấy danh sách yêu thích của user
export const getUserWishlist = async (req, res) => {
    try {
        const wishlist = await Wishlist.find({ user_id: req.user._id })
            .populate({
                path: 'prod_id',
                populate: [
                    { path: 'category_id' },
                    { path: 'brand_id' },
                    { 
                        path: 'images',
                        select: 'image is_primary_image -prod_id',
                        match: { is_primary_image: true }
                    }
                ]
            })
            .sort({ create_at: -1 });

        res.status(200).json({ success: true, data: wishlist });
    } catch (e) {
        console.error("Error fetching wishlist:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Thêm/bỏ sản phẩm khỏi wishlist (toggle)
export const addToWishlist = async (req, res) => {
    const { prod_id } = req.body;
    const user_id = req.user._id;

    if (!prod_id) {
        return res.status(400).json({ success: false, message: "Thiếu prod_id" });
    }

    try {
        // Toggle: nếu đã có thì xóa, nếu chưa thì thêm
        const existing = await Wishlist.findOne({ user_id, prod_id });
        if (existing) {
            await Wishlist.findByIdAndDelete(existing._id);
            return res.status(200).json({ success: true, message: "Đã bỏ yêu thích", action: "removed" });
        }

        const maxItem = await Wishlist.findOne({}).sort({ whishlist_id: -1 });
        const newId = maxItem ? maxItem.whishlist_id + 1 : 1;

        const wishlistItem = new Wishlist({
            whishlist_id: newId,
            user_id,
            prod_id,
        });

        await wishlistItem.save();
        res.status(201).json({ success: true, message: "Đã thêm vào yêu thích", action: "added", data: wishlistItem });
    } catch (e) {
        console.error("Error toggling wishlist:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};

// Xóa sản phẩm khỏi wishlist
export const removeFromWishlist = async (req, res) => {
    try {
        const item = await Wishlist.findById(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: "Không tìm thấy" });
        }

        if (item.user_id.toString() !== req.user._id) {
            return res.status(403).json({ success: false, message: "Không có quyền" });
        }

        await Wishlist.findByIdAndDelete(req.params.id);
        res.status(200).json({ success: true, message: "Đã xóa khỏi yêu thích" });
    } catch (e) {
        console.error("Error removing from wishlist:", e.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};
