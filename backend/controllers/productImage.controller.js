import productImage from '../models/productImage.model.js';
import mongoose from 'mongoose';

export const fetchImagesByProductId = async (req, res) => {
    const productId = req.params.id;
    try {
        const images = await productImage.find({ prod_id: productId });
        if (!images) {
            return res.status(404).json({ success: false, message: "No images found for this product" });
        }
        return res.status(200).json({ success: true, data: images });
    } catch (e) {
        console.error("Error in fetching images:", e.message);
        return res.status(500).json({ success: false, message: "Server Error" });
    }
}

// Upload hình ảnh sản phẩm
export const uploadImage = async (req, res) => {
    try {
        const imageUrl = req.file.path; // đường dẫn ảnh trên Cloudinary
        const productImageMaxId = await productImage.findOne({}).sort({prod_image_id: -1})
        const newProductImage = new productImage({
            prod_image_id: productImageMaxId.prod_image_id + 1,
            image: imageUrl,
            prod_id: req.body.prod_id,
            is_primary_image: req.body.is_primary_image
        });
        await newProductImage.save();
        res.json({ success: true, data: newProductImage  });
      } catch (error) {
        res.status(500).json({ error: 'Upload failed' });
      }
}

//Xóa hết ảnh cũ 
export const deleteImagesByProductId = async (req, res) => {
    try {
      const { id } = req.params;  
      await productImage.deleteMany({ prod_id: new mongoose.Types.ObjectId(id) });
      res.status(200).json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, message: "Failed to delete images" });
    }
  };
  