import express from "express";
import { uploadImage } from "../controllers/productImage.controller.js";
import {deleteImagesByProductId} from "../controllers/productImage.controller.js";
import parser from '../utils/multer.js'
const productImageRouter = express.Router();


productImageRouter.post('/upload', parser.single('image'), uploadImage)
// productImageRouter.get("/:id", fetchImagesByProductId);

productImageRouter.delete('/delete/:id', deleteImagesByProductId);
export default productImageRouter;