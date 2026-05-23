import cron from 'node-cron';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import puppeteer from 'puppeteer';
import * as XLSX from 'xlsx';
import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Traffic from '../models/traffic.model.js';
import sendmail from './sendmail.js';

dayjs.extend(utc);

// Track cron job status
let cronJobStatus = {
    isActive: true,
    lastRun: null,
    lastResult: null,
    nextRun: null,
    recipientEmails: []
};

/**
 * Collect dashboard data (same logic as dashboard.controller.js)
 */
async function collectDashboardData() {
    const nowVN = dayjs().utc().add(7, 'hour');
    const todayStart = nowVN.startOf('day').toDate();
    const yesterdayStart = nowVN.subtract(1, 'day').startOf('day').toDate();
    const monthStart = nowVN.startOf('month').toDate();
    const yearStart = nowVN.subtract(365, 'day').toDate();

    // 1. Overall stats
    const allTimeStats = await Order.aggregate([
        { $match: { status: 'Succeeded' } },
        {
            $group: {
                _id: null,
                totalRevenue: { $sum: "$total" },
                totalOrders: { $count: {} },
                totalSold: { $sum: { $sum: "$items.quantity" } }
            }
        }
    ]);

    const totalCustomers = await User.countDocuments({ role: 'user' });

    const trafficStats = await Traffic.aggregate([
        { $group: { _id: null, totalVisits: { $sum: "$count" } } }
    ]);
    const totalVisits = trafficStats.length > 0 ? trafficStats[0].totalVisits : 0;

    const totalOverall = allTimeStats.length > 0 ? {
        revenue: allTimeStats[0].totalRevenue,
        orders: allTimeStats[0].totalOrders,
        sold: allTimeStats[0].totalSold,
        customers: totalCustomers,
        visits: totalVisits,
        aov: allTimeStats[0].totalOrders > 0
            ? Math.round(allTimeStats[0].totalRevenue / allTimeStats[0].totalOrders)
            : 0
    } : { revenue: 0, orders: 0, sold: 0, customers: totalCustomers, visits: totalVisits, aov: 0 };

    // 2. Today's stats
    const todayStats = await Order.aggregate([
        { $match: { status: 'Succeeded', createdAt: { $gte: todayStart } } },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$total" },
                orders: { $count: {} },
                sold: { $sum: { $sum: "$items.quantity" } }
            }
        }
    ]);

    const yesterdayStats = await Order.aggregate([
        { $match: { status: 'Succeeded', createdAt: { $gte: yesterdayStart, $lt: todayStart } } },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$total" },
                orders: { $count: {} },
                sold: { $sum: { $sum: "$items.quantity" } }
            }
        }
    ]);

    const todayData = todayStats.length > 0 ? todayStats[0] : { revenue: 0, orders: 0, sold: 0 };
    const yesterdayData = yesterdayStats.length > 0 ? yesterdayStats[0] : { revenue: 0, orders: 0, sold: 0 };

    const calcChange = (todayVal, yesterdayVal) => {
        if (yesterdayVal === 0) return todayVal > 0 ? 100 : 0;
        return Math.round(((todayVal - yesterdayVal) / yesterdayVal) * 100);
    };

    const today = {
        revenue: todayData.revenue,
        orders: todayData.orders,
        sold: todayData.sold,
        change: {
            revenue: calcChange(todayData.revenue, yesterdayData.revenue),
            orders: calcChange(todayData.orders, yesterdayData.orders),
            sold: calcChange(todayData.sold, yesterdayData.sold)
        }
    };

    // 3. Conversion rate
    const conversionRate = totalCustomers > 0
        ? ((totalOverall.orders / totalCustomers) * 100).toFixed(2)
        : 0;

    // 4. Top 10 best-selling products
    const productPerformance = await Order.aggregate([
        { $unwind: "$items" },
        { $match: { status: 'Succeeded', createdAt: { $gte: yearStart } } },
        {
            $group: {
                _id: "$items.product",
                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                sold: { $sum: "$items.quantity" }
            }
        },
        {
            $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }
        },
        { $unwind: "$product" },
        { $project: { name: "$product.prod_name", revenue: 1, sold: 1 } },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
    ]);

    // 5. Low stock count (FIXED: Use 'stock' instead of 'quantity')
    const lowStockCount = await Product.countDocuments({
        is_active: true,
        stock: { $lte: 10 }
    });

    // 6. This month revenue
    const monthStats = await Order.aggregate([
        { $match: { status: 'Succeeded', createdAt: { $gte: monthStart } } },
        {
            $group: {
                _id: null,
                revenue: { $sum: "$total" },
                orders: { $count: {} },
                sold: { $sum: { $sum: "$items.quantity" } }
            }
        }
    ]);
    const monthData = monthStats.length > 0 ? monthStats[0] : { revenue: 0, orders: 0, sold: 0 };

    return {
        totalOverall,
        today,
        monthData,
        conversionRate,
        productPerformance,
        lowStockCount,
        reportDate: nowVN.format('DD/MM/YYYY HH:mm')
    };
}

/**
 * Build beautiful HTML email template
 */
function buildReportEmailHTML(data) {
    const { totalOverall, today, monthData, conversionRate, productPerformance, lowStockCount, reportDate } = data;

    const formatCurrency = (val) => Number(val || 0).toLocaleString('vi-VN');

    const changeIcon = (val) => val >= 0 ? '▲' : '▼';
    const changeColor = (val) => val >= 0 ? '#27ae60' : '#e74c3c';

    const topProductsRows = productPerformance.map((p, i) => `
        <tr style="border-bottom: 1px solid #f0f0f0;">
            <td style="padding: 10px 12px; color: #555;">${i + 1}</td>
            <td style="padding: 10px 12px; color: #333; font-weight: 500;">${p.name}</td>
            <td style="padding: 10px 12px; color: #27ae60; font-weight: 600; text-align: right;">${formatCurrency(p.revenue)} ₫</td>
            <td style="padding: 10px 12px; color: #555; text-align: center;">${p.sold}</td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0f2f5;">
        <div style="max-width: 680px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px 16px 0 0; padding: 30px; text-align: center;">
                <h1 style="color: #fff; margin: 0 0 5px 0; font-size: 26px; font-weight: 700; letter-spacing: 1px;">📊 HC SHOP - BÁO CÁO DASHBOARD</h1>
                <p style="color: rgba(255,255,255,0.85); margin: 0; font-size: 14px;">Báo cáo tự động lúc ${reportDate}</p>
            </div>

            <!-- Main Content -->
            <div style="background: #fff; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                
                <!-- Section: Overall Stats -->
                <h2 style="color: #333; font-size: 18px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #667eea;">
                    🏆 Thống kê tổng quan
                </h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 12px; background: #f8f9ff; border-radius: 8px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Tổng Doanh thu</div>
                            <div style="font-size: 22px; font-weight: 700; color: #667eea; margin-top: 5px;">${formatCurrency(totalOverall.revenue)} ₫</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">Tổng Đơn hàng</div>
                            <div style="font-size: 22px; font-weight: 700; color: #27ae60; margin-top: 5px;">${formatCurrency(totalOverall.orders)}</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #fff7ed; border-radius: 8px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 1px;">SP đã bán</div>
                            <div style="font-size: 22px; font-weight: 700; color: #e67e22; margin-top: 5px;">${formatCurrency(totalOverall.sold)}</div>
                        </td>
                    </tr>
                </table>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 12px; background: #fdf2f8; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Khách hàng</div>
                            <div style="font-size: 18px; font-weight: 700; color: #ec4899; margin-top: 4px;">${formatCurrency(totalOverall.customers)}</div>
                        </td>
                        <td style="width: 8px;"></td>
                        <td style="padding: 12px; background: #f0f9ff; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase;">AOV</div>
                            <div style="font-size: 18px; font-weight: 700; color: #0ea5e9; margin-top: 4px;">${formatCurrency(totalOverall.aov)} ₫</div>
                        </td>
                        <td style="width: 8px;"></td>
                        <td style="padding: 12px; background: #f5f3ff; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Tỷ lệ chuyển đổi</div>
                            <div style="font-size: 18px; font-weight: 700; color: #8b5cf6; margin-top: 4px;">${conversionRate}%</div>
                        </td>
                        <td style="width: 8px;"></td>
                        <td style="padding: 12px; background: #ecfdf5; border-radius: 8px; text-align: center; width: 25%;">
                            <div style="font-size: 11px; color: #888; text-transform: uppercase;">Lượt truy cập</div>
                            <div style="font-size: 18px; font-weight: 700; color: #10b981; margin-top: 4px;">${formatCurrency(totalOverall.visits)}</div>
                        </td>
                    </tr>
                </table>

                <!-- Section: Today Stats -->
                <h2 style="color: #333; font-size: 18px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #27ae60;">
                    📅 Thống kê hôm nay
                </h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 15px; background: linear-gradient(135deg, #667eea22, #667eea11); border-radius: 10px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888;">Doanh thu</div>
                            <div style="font-size: 20px; font-weight: 700; color: #333; margin: 5px 0;">${formatCurrency(today.revenue)} ₫</div>
                            <div style="font-size: 12px; color: ${changeColor(today.change.revenue)}; font-weight: 600;">
                                ${changeIcon(today.change.revenue)} ${Math.abs(today.change.revenue)}% so với hôm qua
                            </div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 15px; background: linear-gradient(135deg, #27ae6022, #27ae6011); border-radius: 10px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888;">Đơn hàng</div>
                            <div style="font-size: 20px; font-weight: 700; color: #333; margin: 5px 0;">${formatCurrency(today.orders)}</div>
                            <div style="font-size: 12px; color: ${changeColor(today.change.orders)}; font-weight: 600;">
                                ${changeIcon(today.change.orders)} ${Math.abs(today.change.orders)}% so với hôm qua
                            </div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 15px; background: linear-gradient(135deg, #e67e2222, #e67e2211); border-radius: 10px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888;">SP đã bán</div>
                            <div style="font-size: 20px; font-weight: 700; color: #333; margin: 5px 0;">${formatCurrency(today.sold)}</div>
                            <div style="font-size: 12px; color: ${changeColor(today.change.sold)}; font-weight: 600;">
                                ${changeIcon(today.change.sold)} ${Math.abs(today.change.sold)}% so với hôm qua
                            </div>
                        </td>
                    </tr>
                </table>

                <!-- Section: This Month -->
                <h2 style="color: #333; font-size: 18px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e67e22;">
                    📆 Thống kê tháng này
                </h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                    <tr>
                        <td style="padding: 12px; background: #fff7ed; border-radius: 8px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888;">Doanh thu tháng</div>
                            <div style="font-size: 20px; font-weight: 700; color: #e67e22; margin-top: 5px;">${formatCurrency(monthData.revenue)} ₫</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #f0fdf4; border-radius: 8px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888;">Đơn hàng tháng</div>
                            <div style="font-size: 20px; font-weight: 700; color: #27ae60; margin-top: 5px;">${formatCurrency(monthData.orders)}</div>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="padding: 12px; background: #f8f9ff; border-radius: 8px; text-align: center; width: 33%;">
                            <div style="font-size: 12px; color: #888;">SP đã bán tháng</div>
                            <div style="font-size: 20px; font-weight: 700; color: #667eea; margin-top: 5px;">${formatCurrency(monthData.sold)}</div>
                        </td>
                    </tr>
                </table>

                <!-- Section: Low Stock Alert -->
                ${lowStockCount > 0 ? `
                <div style="background: #fff3e0; border-left: 4px solid #e65100; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                    <div style="font-weight: 700; color: #e65100; font-size: 14px;">⚠️ Cảnh báo tồn kho</div>
                    <div style="color: #bf360c; margin-top: 5px;">Có <strong>${lowStockCount}</strong> sản phẩm sắp hết hàng (số lượng ≤ 10). Vui lòng kiểm tra và nhập thêm hàng.</div>
                </div>
                ` : `
                <div style="background: #e8f5e9; border-left: 4px solid #2e7d32; padding: 15px 20px; border-radius: 0 8px 8px 0; margin-bottom: 30px;">
                    <div style="font-weight: 700; color: #2e7d32; font-size: 14px;">✅ Tồn kho ổn định</div>
                    <div style="color: #1b5e20; margin-top: 5px;">Tất cả sản phẩm đều có số lượng tồn kho đầy đủ.</div>
                </div>
                `}

                <!-- Section: Top Products -->
                <h2 style="color: #333; font-size: 18px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #4e73df;">
                    🔥 Top 10 Sản phẩm bán chạy
                </h2>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background: #f8f9ff;">
                            <th style="padding: 10px 12px; text-align: left; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">#</th>
                            <th style="padding: 10px 12px; text-align: left; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Sản phẩm</th>
                            <th style="padding: 10px 12px; text-align: right; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Doanh thu</th>
                            <th style="padding: 10px 12px; text-align: center; color: #667eea; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Đã bán</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${topProductsRows || '<tr><td colspan="4" style="padding: 15px; text-align: center; color: #999;">Chưa có dữ liệu</td></tr>'}
                    </tbody>
                </table>

                <!-- Footer -->
                <div style="text-align: center; padding: 20px 0 0; border-top: 1px solid #eee; margin-top: 20px;">
                    <p style="color: #999; font-size: 12px; margin: 0;">
                        📧 Email báo cáo tự động từ <strong>HC Shop Admin System</strong><br/>
                        Gửi lúc ${reportDate} (GMT+7) mỗi ngày. Đính kèm báo cáo PDF và chi tiết đơn hàng (Excel).
                    </p>
                    <p style="color: #ccc; font-size: 11px; margin-top: 10px;">
                        © ${new Date().getFullYear()} HC Shop. All rights reserved.
                    </p>
                </div>
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Generate PDF buffer from HTML
 */
async function generatePDFBuffer(html) {
    try {
        const browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(html, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' }
        });
        await browser.close();
        return pdfBuffer;
    } catch (error) {
        console.error('Error generating PDF:', error);
        return null;
    }
}

/**
 * Generate Excel buffer for detailed orders today
 */
async function generateExcelBuffer() {
    try {
        const nowVN = dayjs().utc().add(7, 'hour');
        const todayStart = nowVN.startOf('day').toDate();
        const todayEnd = nowVN.endOf('day').toDate();

        const orders = await Order.find({
            createdAt: { $gte: todayStart, $lte: todayEnd }
        })
            .populate('user_id', 'name email phone_number')
            .populate({
                path: 'items.product',
                populate: { path: 'brand_id', select: 'brand_name' }
            });

        const dataToExport = [];
        let stt = 1;

        orders.forEach((order) => {
            order.items.forEach((item) => {
                dataToExport.push({
                    "STT": stt++,
                    "Mã đơn hàng": order.order_id,
                    "Khách hàng": order.user_id?.name || "Không rõ",
                    "Email": order.user_id?.email || "",
                    "Số điện thoại": order.user_id?.phone_number || "",
                    "Địa chỉ": order.shipping?.address || "",
                    "Tên sản phẩm": item.product?.prod_name || "",
                    "Thương hiệu": item.product?.brand_id?.brand_name || "",
                    "Giảm giá": order.discount_amount || 0,
                    "Màu sắc": item.selected_variants?.['Màu sắc'] || "",
                    "Kích cỡ": item.selected_variants?.['Kích cỡ'] || "",
                    "Mã voucher": order.voucher_id || "", // Nếu có voucher template thì lấy name
                    "Ghi chú": order.shipping?.note || "",
                    "Phương thức nhận": order.shipping?.shipmethod || "",
                    "PT Thanh toán": order.paymentmethod || "",
                    "Đơn giá": item.price,
                    "Số lượng": item.quantity,
                    "Tạm tính": item.price * item.quantity,
                    "Trạng thái đơn hàng": order.status,
                    "Ngày đặt hàng": dayjs(order.createdAt).format('DD/MM/YYYY'),
                    "Tổng cộng đơn": order.total,
                });
            });
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Chi tiết đơn hàng");

        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        return buffer;
    } catch (error) {
        console.error('Error generating Excel:', error);
        return null;
    }
}

/**
 * Send dashboard report email to all admin emails
 */
async function sendDashboardReport() {
    try {
        console.log('[CronJob] 📊 Bắt đầu thu thập dữ liệu báo cáo dashboard...');

        // Collect data
        const data = await collectDashboardData();

        // Build HTML
        const html = buildReportEmailHTML(data);

        // Generate Attachments
        console.log('[CronJob] 📄 Đang tạo báo cáo PDF và Excel...');
        const pdfBuffer = await generatePDFBuffer(html);
        const excelBuffer = await generateExcelBuffer();

        const attachments = [];
        if (pdfBuffer) {
            attachments.push({
                filename: `Dashboard_Report_${dayjs().format('DDMMYYYY')}.pdf`,
                content: pdfBuffer
            });
        }
        if (excelBuffer) {
            attachments.push({
                filename: `Daily_Orders_Details_${dayjs().format('DDMMYYYY')}.xlsx`,
                content: excelBuffer
            });
        }

        // FIXED: Get all users with role 'admin'
        console.log('[CronJob] 👥 Đang lấy danh sách Admin...');
        const adminUsers = await User.find({ role: 'admin' }, { email: 1 });
        let recipientEmails = adminUsers.map(u => u.email).filter(Boolean);

        // Also add the configured REPORT_EMAIL if it exists
        if (process.env.REPORT_EMAIL) {
            const extraEmails = process.env.REPORT_EMAIL.split(',').map(e => e.trim()).filter(Boolean);
            extraEmails.forEach(e => {
                if (!recipientEmails.includes(e)) recipientEmails.push(e);
            });
        }

        if (recipientEmails.length === 0) {
            console.log('[CronJob] ⚠️ Không tìm thấy email admin nào để gửi báo cáo.');
            cronJobStatus.lastResult = 'Không tìm thấy email admin';
            return;
        }

        const subject = `📊 Báo cáo Dashboard HC SHOP - ${data.reportDate}`;

        // Send to all admins
        console.log(`[CronJob] ✉️ Đang gửi email đến ${recipientEmails.length} người nhận...`);
        for (const email of recipientEmails) {
            try {
                await sendmail(email, html, subject, attachments);
                console.log(`[CronJob] ✅ Đã gửi báo cáo đến: ${email}`);
            } catch (err) {
                console.error(`[CronJob] ❌ Lỗi gửi email đến ${email}:`, err.message);
            }
        }

        cronJobStatus.lastRun = new Date().toISOString();
        cronJobStatus.lastResult = `Thành công - đã gửi đến ${recipientEmails.length} email (có đính kèm PDF & Excel)`;
        cronJobStatus.recipientEmails = recipientEmails;

        console.log(`[CronJob] ✅ Hoàn tất gửi báo cáo thành công.`);
    } catch (error) {
        console.error('[CronJob] ❌ Lỗi gửi báo cáo dashboard:', error.message);
        cronJobStatus.lastRun = new Date().toISOString();
        cronJobStatus.lastResult = `Thất bại: ${error.message}`;
    }
}

/**
 * Initialize the cron job to run at 19:00 PM (Vietnam time = UTC+7, so 4:30 UTC)
 */
let cronTask = null;

function initDashboardReportCron() {
    // Schedule cron: 30 11 * * * = 19:00 PM every day
    // Server runs in UTC+7, so this runs at 19:00 PM Vietnam time
    cronTask = cron.schedule('00 19 * * *', async () => {
        console.log('[CronJob] ⏰ Đã đến 19:00 PM - Bắt đầu gửi báo cáo dashboard...');
        await sendDashboardReport();
    }, {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    });

    cronJobStatus.isActive = true;
    cronJobStatus.nextRun = 'Mỗi ngày lúc 19:00 PM (GMT+7)';
    console.log('[CronJob] 📅 Đã khởi tạo cron job gửi báo cáo dashboard lúc 19:00 PM mỗi ngày.');
}

function getCronJobStatus() {
    return cronJobStatus;
}

function toggleCronJob(active) {
    if (active && cronTask) {
        cronTask.start();
        cronJobStatus.isActive = true;
    } else if (!active && cronTask) {
        cronTask.stop();
        cronJobStatus.isActive = false;
    }
    return cronJobStatus;
}

export {
    initDashboardReportCron,
    sendDashboardReport,
    getCronJobStatus,
    toggleCronJob,
    collectDashboardData,
    buildReportEmailHTML
};
