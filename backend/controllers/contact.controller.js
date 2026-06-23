import Contact from '../models/contact.model.js';
import User from '../models/user.model.js';
import asyncHandler from 'express-async-handler';
import sendmail from '../utils/sendmail.js';
import logger from '../utils/logger.js';

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
        // Send email notification to all admins
        sendAdminContactNotificationEmail(contact);

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

// @desc    Send email notification to all admins for new contact message
export const sendAdminContactNotificationEmail = async (contact) => {
    try {
        // Get all admins from database
        const admins = await User.find({ role: 'admin' }, 'email');

        if (!admins || admins.length === 0) {
            // Fallback to system email if no admins found in DB
            const fallbackEmail = process.env.ADMIN_EMAIL || process.env.EMAIL;
            if (fallbackEmail) {
                await sendSingleAdminContactEmail(fallbackEmail, contact);
            }
            return;
        }

        // Send email to each admin
        const sendPromises = admins.map(admin => {
            if (admin.email) {
                return sendSingleAdminContactEmail(admin.email, contact);
            }
            return Promise.resolve();
        });

        await Promise.all(sendPromises);
    } catch (error) {
        logger.error("Error sending admin contact notification emails: " + error.message);
    }
};

// Helper function to send email to a specific admin
const sendSingleAdminContactEmail = async (email, contact) => {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #1976d2; text-align: center;">Thông Báo Tin Nhắn Liên Hệ Mới</h2>
                <p>Chào Admin,</p>
                <p>Hệ thống vừa nhận được một tin nhắn liên hệ mới từ khách hàng qua biểu mẫu liên hệ.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Thông tin chi tiết</h3>
                    <p style="margin: 5px 0;"><b>Họ tên:</b> ${contact.name}</p>
                    <p style="margin: 5px 0;"><b>Email:</b> ${contact.email}</p>
                    <p style="margin: 5px 0;"><b>Số điện thoại:</b> ${contact.phone}</p>
                    <p style="margin: 5px 0;"><b>Chủ đề:</b> ${contact.subject}</p>
                    <p style="margin: 5px 0;"><b>Ngày gửi:</b> ${new Date(contact.createdAt).toLocaleString('vi-VN')}</p>
                </div>

                <div style="background-color: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333; font-size: 16px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Nội dung tin nhắn</h3>
                    <p style="margin: 10px 0; line-height: 1.5; white-space: pre-wrap;">${contact.message}</p>
                </div>

                <div style="margin-top: 30px; text-align: center;">
                    <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/contact" 
                       style="background-color: #1976d2; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; display: inline-block;">
                        Quản Lý Liên Hệ Tại Dashboard
                    </a>
                </div>
                
                <p style="margin-top: 30px; font-size: 12px; color: #888; text-align: center;">Hệ thống thông báo tự động HcShop.</p>
            </div>
        `;
        await sendmail(email, emailContent, `[HcShop] Tin nhắn liên hệ mới: ${contact.subject}`);
    } catch (err) {
        logger.error(`Failed to send contact email to admin ${email}: ${err.message}`);
    }
};

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
