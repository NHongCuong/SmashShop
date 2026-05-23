import {dashboardStatistics, trackVisit, sendReportNow, getReportStatus, toggleReportCron} from '../controllers/dashboard.controller.js';
import express from 'express';

const dashboardRoutes = express.Router();

// Ghi nhận lượt truy cập
dashboardRoutes.post("/track-visit", trackVisit);

// Lấy thống kê dashboard
dashboardRoutes.get("/", dashboardStatistics);

// Gửi báo cáo dashboard qua email ngay lập tức
dashboardRoutes.post("/report/send", sendReportNow);

// Lấy trạng thái cron job báo cáo
dashboardRoutes.get("/report/status", getReportStatus);

// Bật/tắt cron job báo cáo
dashboardRoutes.post("/report/toggle", toggleReportCron);

export default dashboardRoutes;