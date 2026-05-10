import Contact from '../models/contact.model.js';
import asyncHandler from 'express-async-handler';

// @desc    Create new contact message
// @route   POST /api/contacts
// @access  Public
export const createContact = asyncHandler(async (req, res) => {
    const { name, email, phone, subject, message } = req.body;

    if (!name || !email || !phone || !subject || !message) {
        res.status(400);
        throw new Error('Vui lòng điền đầy đủ thông tin');
    }

    const contact = await Contact.create({
        name,
        email,
        phone,
        subject,
        message
    });

    if (contact) {
        res.status(201).json({
            success: true,
            message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất có thể.',
            data: contact
        });
    } else {
        res.status(400);
        throw new Error('Dữ liệu liên hệ không hợp lệ');
    }
});

// @desc    Get all contact messages (for admin)
// @route   GET /api/contacts
// @access  Private/Admin
export const getContacts = asyncHandler(async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';
    const sort = req.query.sort || 'newest';

    const query = {};
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { phone: { $regex: search, $options: 'i' } },
            { subject: { $regex: search, $options: 'i' } }
        ];
    }

    let sortOptions = {};
    switch (sort) {
        case 'oldest':
            sortOptions = { createdAt: 1 };
            break;
        case 'az':
            sortOptions = { name: 1 };
            break;
        case 'za':
            sortOptions = { name: -1 };
            break;
        case 'newest':
        default:
            sortOptions = { createdAt: -1 };
            break;
    }

    const startIndex = (page - 1) * limit;
    const total = await Contact.countDocuments(query);

    const contacts = await Contact.find(query)
        .sort(sortOptions)
        .skip(startIndex)
        .limit(limit);

    res.json({
        data: contacts,
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
    });
});

// @desc    Update contact status
// @route   PUT /api/contacts/:id
// @access  Private/Admin
export const updateContactStatus = asyncHandler(async (req, res) => {
    const { status } = req.body;
    const contact = await Contact.findById(req.params.id);

    if (contact) {
        contact.status = status || contact.status;
        const updatedContact = await contact.save();
        res.json(updatedContact);
    } else {
        res.status(404);
        throw new Error('Không tìm thấy tin nhắn liên hệ');
    }
});

// @desc    Delete contact message
// @route   DELETE /api/contacts/:id
// @access  Private/Admin
export const deleteContact = asyncHandler(async (req, res) => {
    const contact = await Contact.findById(req.params.id);

    if (contact) {
        await contact.deleteOne();
        res.json({ message: 'Xóa tin nhắn liên hệ thành công' });
    } else {
        res.status(404);
        throw new Error('Không tìm thấy tin nhắn liên hệ');
    }
});
