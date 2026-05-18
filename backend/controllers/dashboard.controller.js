import Order from '../models/order.model.js';
import User from '../models/user.model.js';
import Product from '../models/product.model.js';

export const dashboardStatistics = async (req, res) => {
    const startDate = req.query.start_date || new Date(new Date().setDate(new Date().getDate() - 365));
    const endDate = req.query.end_date || new Date();

    try {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        if (isNaN(startDateObj) || isNaN(endDateObj)) {
            return res.status(400).json({ success: false, message: "Invalid date format. Please use YYYY-MM-DD." });
        }

        // 1. Thống kê theo thời gian (Line Chart)
        const timeSeriesResult = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDateObj, $lt: endDateObj },
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
            { $match: { status: "Succeeded" } },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$total" },
                    totalOrders: { $sum: 1 },
                    totalSold: { $sum: { $sum: "$items.quantity" } }
                }
            }
        ]);

        // Đếm tổng số khách hàng (role: user)
        const totalCustomers = await User.countDocuments({ role: 'user' });

        const totalOverall = allTimeStats.length > 0 ? {
            revenue: allTimeStats[0].totalRevenue,
            orders: allTimeStats[0].totalOrders,
            sold: allTimeStats[0].totalSold,
            customers: totalCustomers,
            aov: allTimeStats[0].totalOrders > 0 ? (allTimeStats[0].totalRevenue / allTimeStats[0].totalOrders) : 0
        } : { revenue: 0, orders: 0, sold: 0, customers: totalCustomers, aov: 0 };

        // 3. Hiệu suất sản phẩm (Top sản phẩm bán chạy theo doanh thu)
        const productPerformance = await Order.aggregate([
            { $match: { status: "Succeeded", createdAt: { $gte: startDateObj, $lt: endDateObj } } },
            { $unwind: "$items" },
            {
                $group: {
                    _id: "$items.product",
                    revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
                    sold: { $sum: "$items.quantity" }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "products",
                    localField: "_id",
                    foreignField: "_id",
                    as: "productInfo"
                }
            },
            { $unwind: "$productInfo" },
            {
                $project: {
                    name: "$productInfo.prod_name",
                    revenue: 1,
                    sold: 1,
                    views: "$productInfo.views"
                }
            }
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