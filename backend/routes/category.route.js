import { fetchAllCategory } from "../controllers/category.controller.js";
import express from 'express'

const categoryRouter = express.Router()

// Lấy danh sách tất cả Category
categoryRouter.get("/",fetchAllCategory)

export default categoryRouter