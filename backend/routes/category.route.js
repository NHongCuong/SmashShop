import express from 'express';
import { 
    fetchAllCategory, 
    fetchCategoriesAdmin, 
    createCategory, 
    updateCategory, 
    deleteCategory, 
    exportCategoriesExcel, 
    importCategoriesExcel 
} from "../controllers/category.controller.js";
import parser from '../utils/multer.js';
import multer from 'multer';

const categoryRouter = express.Router();
const upload = multer(); // For excel import (memory storage)

// Client routes
categoryRouter.get("/", fetchAllCategory);

// Admin routes
categoryRouter.get("/admin", fetchCategoriesAdmin);
categoryRouter.post("/", parser.single('image'), createCategory);
categoryRouter.put("/:id", parser.single('image'), updateCategory);
categoryRouter.delete("/:id", deleteCategory);
categoryRouter.get("/export", exportCategoriesExcel);
categoryRouter.post("/import", upload.single('file'), importCategoriesExcel);

export default categoryRouter;