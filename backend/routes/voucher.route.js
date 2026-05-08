import express from 'express';
import { 
    fetchAllVouchers, 
    fetchVouchersAdmin, 
    createVoucher, 
    updateVoucher, 
    deleteVoucher,
    exportVouchersExcel,
    importVouchersExcel
} from '../controllers/voucher.controller.js';
import multer from 'multer';

const router = express.Router();
const upload = multer(); // For excel import

// Public
router.get('/', fetchAllVouchers);

// Admin
router.get('/admin', fetchVouchersAdmin);
router.post('/', createVoucher);
router.put('/:id', updateVoucher);
router.delete('/:id', deleteVoucher);
router.get('/export', exportVouchersExcel);
router.post('/import', upload.single('file'), importVouchersExcel);

export default router;
