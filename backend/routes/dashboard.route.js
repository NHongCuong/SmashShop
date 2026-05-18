import {dashboardStatistics, trackVisit} from '../controllers/dashboard.controller.js';
import express from 'express';

const dashboardRoutes = express.Router();

// Ghi nhận lượt truy cập
dashboardRoutes.post("/track-visit", trackVisit);

// Lấy thống kê dashboard
dashboardRoutes.get("/", dashboardStatistics);

export default dashboardRoutes;