import Category from "../models/category.model.js";
import Product from "../models/product.model.js";
import { getNextSequenceValue } from "../models/counter.model.js";
import * as XLSX from 'xlsx';
import { getVietnamTime } from "../utils/dayjs.js";

// Lấy tất cả danh mục (cho client)
export const fetchAllCategory = async (req, res) => {
    try {
        const categories = await Category.find();
        res.status(200).json({ success: true, data: categories });
    } catch (e) {
        console.error(e.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Lấy danh mục cho Admin (có phân trang, tìm kiếm, sắp xếp)
export const fetchCategoriesAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sort = 'newest' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.category_name = { $regex: search, $options: 'i' };
        }

        let sortOption = { create_at: -1 };
        if (sort === 'oldest') sortOption = { create_at: 1 };
        if (sort === 'az') sortOption = { category_name: 1 };
        if (sort === 'za') sortOption = { category_name: -1 };

        const categories = await Category.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Category.countDocuments(query);

        res.status(200).json({
            success: true,
            data: categories,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page)
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Tạo danh mục mới
export const createCategory = async (req, res) => {
    try {
        const { category_name, featured_category } = req.body;
        const image = req.file ? req.file.path : req.body.image;

        if (!category_name) {
            return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
        }

        const maxCategory = await Category.findOne().sort({ category_id: -1 });
        const category_id = maxCategory ? maxCategory.category_id + 1 : 1;

        const newCategory = new Category({
            category_id,
            category_name,
            image,
            featured_category: featured_category || ''
        });

        await newCategory.save();
        res.status(201).json({ success: true, data: newCategory });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Cập nhật danh mục
export const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, featured_category } = req.body;
        const image = req.file ? req.file.path : req.body.image;

        const updateData = { category_name, update_at: getVietnamTime() };
        if (image) updateData.image = image;
        updateData.featured_category = featured_category || '';

        const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedCategory) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        res.status(200).json({ success: true, data: updatedCategory });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xóa danh mục
export const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        // Kiểm tra xem có sản phẩm nào đang hoạt động thuộc danh mục này không
        const productCount = await Product.countDocuments({ category_id: id, is_active: true });
        if (productCount > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể xóa danh mục này vì vẫn còn sản phẩm đang hoạt động thuộc danh mục. Vui lòng xóa sản phẩm trước.' 
            });
        }

        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
        }

        // Cập nhật các sản phẩm đã deactive (đã xóa mềm) để không còn tham chiếu tới danh mục đã xóa
        await Product.updateMany({ category_id: id }, { category_id: null });

        res.status(200).json({ success: true, message: 'Đã xóa danh mục thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xuất Excel
export const exportCategoriesExcel = async (req, res) => {
    try {
        const categories = await Category.find().sort({ category_id: 1 });

        const data = categories.map((c, index) => ({
            'STT': index + 1,
            'ID': c.category_id,
            'Tên danh mục': c.category_name,
            'Ảnh': c.image || '',
            'Nổi bật': c.featured_category || '',
            'Ngày tạo': c.create_at,
            'Ngày sửa': c.update_at
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Categories');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=categories.xlsx');
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Import Excel
export const importCategoriesExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng upload file excel' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const item of data) {
            const name = item['Danh mục'] || item['Tên danh mục'];
            const image = item['Ảnh'] || item['image'];

            if (name) {
                // Kiểm tra xem đã tồn tại chưa
                const existing = await Category.findOne({ category_name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (!existing) {
                    const maxCategory = await Category.findOne().sort({ category_id: -1 });
                    const category_id = maxCategory ? maxCategory.category_id + 1 : 1;
                    const newCat = new Category({
                        category_id,
                        category_name: name,
                        image: image || ''
                    });
                    await newCat.save();
                }
            }
        }

        res.status(200).json({ success: true, message: 'Import danh mục thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
