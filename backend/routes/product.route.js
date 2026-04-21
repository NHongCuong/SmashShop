import express from "express";
import { fetchAllProducts, fetchProductById, createProduct, updateProduct, deactiveProduct, importProducts } from "../controllers/product.controller.js";
import multer from "multer";
import parser from '../utils/multer.js'

const productRouter = express.Router();
const excelUpload = multer({ storage: multer.memoryStorage() });

// Lấy thông tin 1 sản phẩm
productRouter.get("/:id", fetchProductById);

// Lấy danh sách tất cả sản phẩm
productRouter.get("/", fetchAllProducts);

// Cập nhật thông tin sản phẩm
productRouter.put("/:id", updateProduct);

// Deactive sản phẩm
productRouter.put("/deactive/:id", deactiveProduct);
// Thêm sản phẩm
productRouter.post("/", parser.single('image'), createProduct)

// Import sản phẩm từ Excel
productRouter.post("/import", excelUpload.single('file'), importProducts);

export default productRouter;