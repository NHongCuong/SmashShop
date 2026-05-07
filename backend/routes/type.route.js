import express from 'express';
import { 
    fetchAllTypes, 
    fetchTypesAdmin, 
    createType, 
    updateType, 
    deleteType,
    exportTypesExcel,
    importTypesExcel
} from '../controllers/type.controller.js';
import multer from 'multer';

const router = express.Router();
const upload = multer(); // For excel import

// Public
router.get('/', fetchAllTypes);

// Admin
router.get('/admin', fetchTypesAdmin);
router.post('/', createType);
router.put('/:id', updateType);
router.delete('/:id', deleteType);
router.get('/export', exportTypesExcel);
router.post('/import', upload.single('file'), importTypesExcel);

export default router;
