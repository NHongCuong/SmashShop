import Type from "../models/type.model.js";
import * as XLSX from 'xlsx';
import { getVietnamTime } from "../utils/dayjs.js";

// Lấy tất cả phân loại (cho client)
export const fetchAllTypes = async (req, res) => {
    try {
        const types = await Type.find();
        res.status(200).json({ success: true, data: types });
    } catch (e) {
        console.error(e.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Lấy phân loại cho Admin (có phân trang, tìm kiếm, sắp xếp)
export const fetchTypesAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sort = 'newest' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.type_name = { $regex: search, $options: 'i' };
        }

        let sortOption = { create_at: -1 };
        if (sort === 'oldest') sortOption = { create_at: 1 };
        if (sort === 'az') sortOption = { type_name: 1 };
        if (sort === 'za') sortOption = { type_name: -1 };

        const types = await Type.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Type.countDocuments(query);

        res.status(200).json({
            success: true,
            data: types,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page)
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Tạo phân loại mới
export const createType = async (req, res) => {
    try {
        const { type_name } = req.body;

        if (!type_name) {
            return res.status(400).json({ success: false, message: 'Tên phân loại là bắt buộc' });
        }

        const maxType = await Type.findOne().sort({ type_id: -1 });
        const type_id = maxType ? maxType.type_id + 1 : 1;

        const newType = new Type({
            type_id,
            type_name
        });

        await newType.save();
        res.status(201).json({ success: true, data: newType });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Cập nhật phân loại
export const updateType = async (req, res) => {
    try {
        const { id } = req.params;
        const { type_name } = req.body;

        const updatedType = await Type.findByIdAndUpdate(id, { 
            type_name,
            update_at: getVietnamTime()
        }, { new: true });

        if (!updatedType) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phân loại' });
        }

        res.status(200).json({ success: true, data: updatedType });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xóa phân loại
export const deleteType = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedType = await Type.findByIdAndDelete(id);

        if (!deletedType) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy phân loại' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa phân loại thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xuất Excel
export const exportTypesExcel = async (req, res) => {
    try {
        const types = await Type.find().sort({ type_id: 1 });
        
        const data = types.map((t, index) => ({
            'STT': index + 1,
            'ID': t.type_id,
            'Phân loại': t.type_name,
            'Ngày tạo': t.create_at,
            'Ngày sửa': t.update_at
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Types');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=types.xlsx');
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Import Excel
export const importTypesExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng upload file excel' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const item of data) {
            const name = item['Phân loại'] || item['type_name'] || item['Tên phân loại'];

            if (name) {
                // Kiểm tra xem đã tồn tại chưa
                const existing = await Type.findOne({ type_name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (!existing) {
                    const maxType = await Type.findOne().sort({ type_id: -1 });
                    const type_id = maxType ? maxType.type_id + 1 : 1;
                    const newType = new Type({
                        type_id,
                        type_name: name
                    });
                    await newType.save();
                }
            }
        }

        res.status(200).json({ success: true, message: 'Import phân loại thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
