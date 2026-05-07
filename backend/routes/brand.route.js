import express from 'express';
import { 
    fetchAllBrands, 
    fetchBrandsAdmin, 
    createBrand, 
    updateBrand, 
    deleteBrand,
    exportBrandsExcel,
    importBrandsExcel
} from '../controllers/brand.controller.js';
import multer from 'multer';

const router = express.Router();
const upload = multer(); // For excel import

// Public
router.get('/', fetchAllBrands);

// Admin
router.get('/admin', fetchBrandsAdmin);
router.post('/', createBrand);
router.put('/:id', updateBrand);
router.delete('/:id', deleteBrand);
router.get('/export', exportBrandsExcel);
router.post('/import', upload.single('file'), importBrandsExcel);

export default router;