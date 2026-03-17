import {dashboardStatistics} from '../controllers/dashboard.controller.js';
import express from 'express';

const dashboardRoutes = express.Router();
// Lấy thống kê dashboard
dashboardRoutes.get("/", dashboardStatistics);

export default dashboardRoutes;