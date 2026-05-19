import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';
import Traffic from '../models/traffic.model.js';
import dayjs from 'dayjs';

export const trackVisit = async (req, res) => {
    try {
        const today = dayjs().format('YYYY-MM-DD');
        await Traffic.findOneAndUpdate(
            { date: today },
            { $inc: { count: 1 } },
            { upsert: true, new: true }
        );
        res.status(200).json({ success: true });
    } catch (error) {
        console.error("Error tracking visit:", error.message);
        res.status(500).json({ success: false });
    }
};

export const dashboardStatistics = async (req, res) => {
    // Ép kiểu Date từ query string hoặc lấy mặc định 1 năm
    const startDate = req.query.start_date ? new Date(req.query.start_date) : new Date(new Date().setDate(new Date().getDate() - 365));
    const endDate = req.query.end_date ? new Date(req.query.end_date) : new Date();

    try {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            return res.status(400).json({ success: false, message: "Invalid date format. Please use YYYY-MM-DD." });
        }

        // 1. Thống kê theo thời gian (Line Chart)
        const timeSeriesResult = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate, $lte: endDate },
                    status: "Succeeded"
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalRevenue: { $sum: "$total" },
                    totalOrders: { $sum: 1 },
                    totalSold: { $sum: { $sum: "$items.quantity" } }
                }
            },
            {
                $project: {
                    date: "$_id",
                    revenue: "$totalRevenue",
                    orders: "$totalOrders",
                    sold: "$totalSold",
                    _id: 0
                }
            },
            { $sort: { date: 1 } }
        ]);

        // 2. Thống kê tổng quan (Stat Cards)
        const allTimeStats = await Order.aggregate([
            { $match: { 
                status: 'Succeeded'
            }},
            { $group: {
                _id: null,
                totalRevenue: { $sum: "$total" },
                totalOrders: { $count: {} },
                totalSold: { $sum: { $sum: "$items.quantity" } }
            }}
        ]);

        // Đếm tổng số khách hàng (role: user)
        const totalCustomers = await User.countDocuments({ role: 'user' });

        // Tính tổng lượt truy cập từ trước tới nay
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
            aov: allTimeStats[0].totalOrders > 0 ? (allTimeStats[0].totalRevenue / allTimeStats[0].totalOrders) : 0
        } : { revenue: 0, orders: 0, sold: 0, customers: totalCustomers, visits: totalVisits, aov: 0 };

        // 3. Hiệu suất sản phẩm (Top sản phẩm bán chạy theo doanh thu)
        const productPerformance = await Order.aggregate([
            { $unwind: "$items" },
            { $match: { 
                status: 'Succeeded',
                createdAt: { $gte: startDate }
            }},
            { $group: {
                _id: "$items.product",
                revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                sold: { $sum: "$items.quantity" }
            }},
            { $lookup: {
                from: "products",
                localField: "_id",
                foreignField: "_id",
                as: "product"
            }},
            { $unwind: "$product" },
            { $project: {
                name: "$product.prod_name",
                revenue: 1,
                sold: 1
            }},
            { $sort: { revenue: -1 } },
            { $limit: 10 }
        ]);

        // 3.1 Thống kê doanh thu tất cả sản phẩm theo các mốc (Today, This Month, 365 Days)
        // Tính toán các mốc thời gian chuẩn Việt Nam (khớp với cách lưu createdAt đã offset +7)
        // Cách lưu hiện tại: createdAt = UTC + 7h
        const nowVN = dayjs().utc().add(7, 'hour');
        const todayStart = nowVN.startOf('day').toDate();
        const monthStart = nowVN.startOf('month').toDate();
        const yearStart = nowVN.startOf('year').subtract(1, 'year').toDate(); // Hoặc tùy chọn mốc 365 ngày
        const year365Start = nowVN.subtract(365, 'day').toDate();

        const allProductsRevenue = await Product.aggregate([
            { $match: { is_active: true } },
            { $lookup: {
                from: "orders",
                let: { prodId: "$_id" },
                pipeline: [
                    { $match: { 
                        $expr: { 
                            $and: [
                                { $eq: ["$status", "Succeeded"] },
                                { $gte: ["$createdAt", year365Start] }
                            ]
                        }
                    }},
                    { $unwind: "$items" },
                    { $match: { $expr: { $eq: ["$items.product", "$$prodId"] } } }
                ],
                as: "sales"
            }},
            { $project: {
                name: "$prod_name",
                todayRevenue: {
                    $reduce: {
                        input: "$sales",
                        initialValue: 0,
                        in: { $add: ["$$value", { $cond: [{ $gte: ["$$this.createdAt", todayStart] }, { $multiply: ["$$this.items.price", "$$this.items.quantity"] }, 0] }] }
                    }
                },
                monthRevenue: {
                    $reduce: {
                        input: "$sales",
                        initialValue: 0,
                        in: { $add: ["$$value", { $cond: [{ $gte: ["$$this.createdAt", monthStart] }, { $multiply: ["$$this.items.price", "$$this.items.quantity"] }, 0] }] }
                    }
                },
                yearRevenue: {
                    $reduce: {
                        input: "$sales",
                        initialValue: 0,
                        in: { $add: ["$$value", { $multiply: ["$$this.items.price", "$$this.items.quantity"] }] }
                    }
                }
            }},
            { $sort: { yearRevenue: -1 } }
        ]);

        // 4. Sản phẩm bị xem nhiều nhưng tỷ lệ mua thấp (Top Views vs Low Sales)
        const lowConversionProducts = await Product.find({ is_active: true })
            .sort({ views: -1 })
            .limit(10)
            .select('prod_name views quantity_sold');

        // Giả lập Conversion Rate (Tính trên tổng số User hiện có)
        // Trong thực tế cần bảng Traffic. Ở đây tạm tính: tổng đơn / tổng user
        const conversionRate = totalCustomers > 0 ? ((totalOverall.orders / totalCustomers) * 100).toFixed(2) : 0;

        res.status(200).json({
            success: true,
            chartData: timeSeriesResult, // Đổi tên cho khớp frontend
            totalOverall,
            productPerformance,
            allProductsRevenue,
            lowConversionProducts,
            conversionRate,
            today: { // Tạm thời để trống hoặc tính nhanh doanh thu hôm nay
                revenue: 0,
                orders: 0,
                sold: 0,
                change: { revenue: 0, orders: 0, sold: 0 }
            }
        });
    } catch (error) {
        console.error("Error in dashboardStatistics:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};