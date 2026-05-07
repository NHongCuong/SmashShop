import Brand from "../models/brand.model.js";
import * as XLSX from 'xlsx';
import { getVietnamTime } from "../utils/dayjs.js";

// Lấy tất cả thương hiệu (cho client)
export const fetchAllBrands = async (req, res) => {
    try {
        const brands = await Brand.find();
        res.status(200).json({ success: true, data: brands });
    } catch (e) {
        console.error(e.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Lấy thương hiệu cho Admin (có phân trang, tìm kiếm, sắp xếp)
export const fetchBrandsAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sort = 'newest' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.brand_name = { $regex: search, $options: 'i' };
        }

        let sortOption = { create_at: -1 };
        if (sort === 'oldest') sortOption = { create_at: 1 };
        if (sort === 'az') sortOption = { brand_name: 1 };
        if (sort === 'za') sortOption = { brand_name: -1 };

        const brands = await Brand.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Brand.countDocuments(query);

        res.status(200).json({
            success: true,
            data: brands,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page)
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Tạo thương hiệu mới
export const createBrand = async (req, res) => {
    try {
        const { brand_name } = req.body;

        if (!brand_name) {
            return res.status(400).json({ success: false, message: 'Tên thương hiệu là bắt buộc' });
        }

        const maxBrand = await Brand.findOne().sort({ brand_id: -1 });
        const brand_id = maxBrand ? maxBrand.brand_id + 1 : 1;

        const newBrand = new Brand({
            brand_id,
            brand_name
        });

        await newBrand.save();
        res.status(201).json({ success: true, data: newBrand });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Cập nhật thương hiệu
export const updateBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const { brand_name } = req.body;

        const updatedBrand = await Brand.findByIdAndUpdate(id, { 
            brand_name,
            update_at: getVietnamTime()
        }, { new: true });

        if (!updatedBrand) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' });
        }

        res.status(200).json({ success: true, data: updatedBrand });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xóa thương hiệu
export const deleteBrand = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBrand = await Brand.findByIdAndDelete(id);

        if (!deletedBrand) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thương hiệu' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa thương hiệu thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xuất Excel
export const exportBrandsExcel = async (req, res) => {
    try {
        const brands = await Brand.find().sort({ brand_id: 1 });
        
        const data = brands.map((b, index) => ({
            'STT': index + 1,
            'ID': b.brand_id,
            'Thương hiệu': b.brand_name,
            'Ngày tạo': b.create_at,
            'Ngày sửa': b.update_at
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Brands');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=brands.xlsx');
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Import Excel
export const importBrandsExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng upload file excel' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const item of data) {
            const name = item['Thương hiệu'] || item['brand_name'] || item['Tên thương hiệu'];

            if (name) {
                // Kiểm tra xem đã tồn tại chưa
                const existing = await Brand.findOne({ brand_name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (!existing) {
                    const maxBrand = await Brand.findOne().sort({ brand_id: -1 });
                    const brand_id = maxBrand ? maxBrand.brand_id + 1 : 1;
                    const newBrand = new Brand({
                        brand_id,
                        brand_name: name
                    });
                    await newBrand.save();
                }
            }
        }

        res.status(200).json({ success: true, message: 'Import thương hiệu thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
