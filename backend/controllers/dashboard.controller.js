import Order from '../models/order.model.js';
import OrderDetail from '../models/order_detail.js';

export const dashboardStatistics = async (req, res) => {
    const startDate = req.query.start_date || new Date();
    const endDate = req.query.end_date || new Date();

    try {
        const startDateObj = new Date(startDate);
        const endDateObj = new Date(endDate);
        
        // kiểm tra date format
        if (isNaN(startDateObj) || isNaN(endDateObj)) {
            return res.status(400).json({ success: false, message: "Invalid date format. Please use YYYY-MM-DD." });
        }

        // kiểm tra ngày bắt đầu phải nhỏ hơn ngày kết thúc
        if (startDateObj > endDateObj) {

            return res.status(400).json({ success: false, message: "Start date must be before end date" });
        }

        const result = await Order.aggregate([
            {
                $match: {
                    createdAt: {
                        $gte: startDateObj,
                        $lt: endDateObj
                    },
                    status: "Succeeded"
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    totalRevenue: { $sum: "$total" },
                    totalOrders: { $sum: 1 },
                    totalSold: { $sum: { $size: "$items" } }
                }
            },
            {
                $project: {
                    date: "$_id",
                    revenue: "$totalRevenue",
                    orders: "$totalOrders",
                    sold: "$totalSold",
                    _id: 0 // Exclude _id from the output
                }
            },
            {
                $sort: { date: 1 }
            }
        ]);

        // Calculate cumulative totals across all time for "Succeeded" orders
        const allTimeStats = await Order.aggregate([
            {
                $match: {
                    status: "Succeeded"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$total" },
                    totalOrders: { $sum: 1 },
                    totalSold: { $sum: { $size: "$items" } }
                }
            }
        ]);

        const totalOverall = allTimeStats.length > 0 ? {
            revenue: allTimeStats[0].totalRevenue,
            orders: allTimeStats[0].totalOrders,
            sold: allTimeStats[0].totalSold
        } : { revenue: 0, orders: 0, sold: 0 };

        res.status(200).json({
            success: true,
            data: result,
            totalOverall
        });
    } catch (error) {
        console.error("Error in dashboardStatistics:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};