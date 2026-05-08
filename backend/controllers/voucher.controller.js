import Voucher from "../models/voucher.model.js";
import * as XLSX from 'xlsx';
import { getVietnamTime } from "../utils/dayjs.js";

// Lấy tất cả khuyến mãi (cho client)
export const fetchAllVouchers = async (req, res) => {
    try {
        const vouchers = await Voucher.find();
        res.status(200).json({ success: true, data: vouchers });
    } catch (e) {
        console.error(e.message);
        return res.status(500).json({ success: false, message: 'Server Error' });
    }
};

// Lấy khuyến mãi cho Admin (có phân trang, tìm kiếm, sắp xếp)
export const fetchVouchersAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sort = 'newest' } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (search) {
            query.voucher_name = { $regex: search, $options: 'i' };
        }

        let sortOption = { create_at: -1 };
        if (sort === 'oldest') sortOption = { create_at: 1 };
        if (sort === 'az') sortOption = { voucher_name: 1 };
        if (sort === 'za') sortOption = { voucher_name: -1 };

        const vouchers = await Voucher.find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(parseInt(limit));

        const totalItems = await Voucher.countDocuments(query);

        res.status(200).json({
            success: true,
            data: vouchers,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: parseInt(page)
        });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Tạo khuyến mãi mới
export const createVoucher = async (req, res) => {
    try {
        const { voucher_name, discount_percent } = req.body;

        if (!voucher_name) {
            return res.status(400).json({ success: false, message: 'Tên khuyến mãi là bắt buộc' });
        }

        if (discount_percent === undefined || discount_percent === null) {
            return res.status(400).json({ success: false, message: '% giảm giá là bắt buộc' });
        }

        if (discount_percent < 0 || discount_percent > 100) {
            return res.status(400).json({ success: false, message: '% giảm giá phải từ 0 đến 100' });
        }

        const maxVoucher = await Voucher.findOne().sort({ voucher_id: -1 });
        const voucher_id = maxVoucher ? maxVoucher.voucher_id + 1 : 1;

        const newVoucher = new Voucher({
            voucher_id,
            voucher_name,
            discount_percent
        });

        await newVoucher.save();
        res.status(201).json({ success: true, data: newVoucher });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Cập nhật khuyến mãi
export const updateVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const { voucher_name, discount_percent } = req.body;

        if (discount_percent !== undefined && (discount_percent < 0 || discount_percent > 100)) {
            return res.status(400).json({ success: false, message: '% giảm giá phải từ 0 đến 100' });
        }

        const updateData = { update_at: getVietnamTime() };
        if (voucher_name !== undefined) updateData.voucher_name = voucher_name;
        if (discount_percent !== undefined) updateData.discount_percent = discount_percent;

        const updatedVoucher = await Voucher.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedVoucher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        res.status(200).json({ success: true, data: updatedVoucher });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xóa khuyến mãi
export const deleteVoucher = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedVoucher = await Voucher.findByIdAndDelete(id);

        if (!deletedVoucher) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa khuyến mãi thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Xuất Excel
export const exportVouchersExcel = async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ voucher_id: 1 });
        
        const data = vouchers.map((v, index) => ({
            'STT': index + 1,
            'ID': v.voucher_id,
            'Khuyến mãi': v.voucher_name,
            '% Giảm giá': v.discount_percent,
            'Ngày tạo': v.create_at,
            'Ngày sửa': v.update_at
        }));

        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Vouchers');

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=vouchers.xlsx');
        res.send(buffer);
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};

// Import Excel
export const importVouchersExcel = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Vui lòng upload file excel' });
        }

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);

        for (const item of data) {
            const name = item['Khuyến mãi'] || item['voucher_name'] || item['Tên khuyến mãi'];
            const discount = item['% Giảm giá'] || item['discount_percent'] || item['Giảm giá'] || 0;

            if (name) {
                // Kiểm tra xem đã tồn tại chưa
                const existing = await Voucher.findOne({ voucher_name: { $regex: new RegExp(`^${name}$`, 'i') } });
                if (!existing) {
                    const maxVoucher = await Voucher.findOne().sort({ voucher_id: -1 });
                    const voucher_id = maxVoucher ? maxVoucher.voucher_id + 1 : 1;
                    const newVoucher = new Voucher({
                        voucher_id,
                        voucher_name: name,
                        discount_percent: Number(discount) || 0
                    });
                    await newVoucher.save();
                }
            }
        }

        res.status(200).json({ success: true, message: 'Import khuyến mãi thành công' });
    } catch (e) {
        res.status(500).json({ success: false, message: e.message });
    }
};
