import { fetchAllBrand } from '../controllers/brand.controller.js'
import express from 'express'

const brandRouter = express.Router()

// Lấy danh sách tất cả Category
brandRouter.get("/",fetchAllBrand)

export default brandRouter