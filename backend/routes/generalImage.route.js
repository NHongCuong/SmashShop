import express from 'express';
import {
    getGeneralImages,
    getGeneralImageById,
    createGeneralImage,
    updateGeneralImage,
    deleteGeneralImage,
    importGeneralImages,
    exportGeneralImages
} from '../controllers/generalImage.controller.js';
import multer from 'multer';
import parser from '../utils/multer.js';

const generalImageRouter = express.Router();
const excelUpload = multer({ storage: multer.memoryStorage() });

generalImageRouter.get('/', getGeneralImages);
generalImageRouter.get('/export', exportGeneralImages);
generalImageRouter.get('/:id', getGeneralImageById);

generalImageRouter.post('/', parser.array('image', 20), createGeneralImage);
generalImageRouter.put('/:id', parser.array('image', 20), updateGeneralImage);
generalImageRouter.delete('/:id', deleteGeneralImage);

generalImageRouter.post('/import', excelUpload.single('file'), importGeneralImages);

export default generalImageRouter;
