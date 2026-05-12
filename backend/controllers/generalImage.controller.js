import GeneralImage from '../models/generalImage.model.js';
import * as XLSX from 'xlsx';
import { getVietnamTime } from '../utils/dayjs.js';

export const getGeneralImages = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', sort = 'newest' } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
            query.image_name = { $regex: search, $options: 'i' };
        }

        let sortCriteria = {};
        if (sort === 'newest') sortCriteria = { create_at: -1 };
        else if (sort === 'oldest') sortCriteria = { create_at: 1 };
        else if (sort === 'a-z') sortCriteria = { image_name: 1 };
        else if (sort === 'z-a') sortCriteria = { image_name: -1 };

        const images = await GeneralImage.find(query)
            .sort(sortCriteria)
            .skip(skip)
            .limit(Number(limit));

        const totalItems = await GeneralImage.countDocuments(query);

        res.status(200).json({
            success: true,
            data: images,
            totalItems,
            totalPages: Math.ceil(totalItems / limit),
            currentPage: Number(page)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getGeneralImageById = async (req, res) => {
    try {
        const image = await GeneralImage.findById(req.params.id);
        if (!image) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, data: image });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createGeneralImage = async (req, res) => {
    try {
        const { image_name } = req.body;
        const imageUrls = req.files ? req.files.map(file => file.path) : [];

        const newGeneralImage = new GeneralImage({
            image_name,
            image: imageUrls
        });

        await newGeneralImage.save();
        res.status(201).json({ success: true, data: newGeneralImage });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateGeneralImage = async (req, res) => {
    try {
        const { id } = req.params;
        const { image_name } = req.body;
        const { remainingOldImages } = req.body;

        let oldImages = [];
        if (remainingOldImages) {
            oldImages = Array.isArray(remainingOldImages) ? remainingOldImages : [remainingOldImages];
        }

        const newImages = req.files ? req.files.map(file => file.path) : [];
        const allImages = [...oldImages, ...newImages];

        const updated = await GeneralImage.findByIdAndUpdate(
            id,
            { image_name, image: allImages, updated_at: getVietnamTime() },
            { new: true }
        );

        if (!updated) return res.status(404).json({ success: false, message: 'Not found' });

        res.status(200).json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteGeneralImage = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await GeneralImage.findByIdAndDelete(id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
        res.status(200).json({ success: true, message: 'Deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const importGeneralImages = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'File required' });

        const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
        const data = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);

        const imported = [];
        for (const row of data) {
            const image_name = row['Tên ảnh'];
            const image_url = row['Url_Image'] || row['Đường dẫn ảnh'];
            
            if (image_name && image_url) {
                const images = String(image_url).split(',').map(url => url.trim());
                const newImg = new GeneralImage({ image_name, image: images });
                await newImg.save();
                imported.push(newImg);
            }
        }

        res.status(200).json({ success: true, message: `Imported ${imported.length} items` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const exportGeneralImages = async (req, res) => {
    try {
        const images = await GeneralImage.find({});
        const data = images.map((img, index) => ({
            STT: index + 1,
            'Ảnh': img.image && img.image.length > 0 ? img.image[0] : '',
            'Url_Image': img.image ? img.image.join(', ') : '',
            'Tên ảnh': img.image_name,
            'Ngày tạo': img.create_at,
            'Ngày sửa': img.updated_at
        }));

        res.status(200).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
