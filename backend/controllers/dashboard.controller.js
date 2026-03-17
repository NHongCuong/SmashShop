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

        // Extract results
        const totalRevenue = result.length > 0 ? result[0].totalRevenue : 0;
        const totalOrders = result.length > 0 ? result[0].totalOrders : 0;
        const totalProductsSold = result.length > 0 ? result[0].totalProductsSold : 0;
        
        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error("Error in dashboardStatistics:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
};