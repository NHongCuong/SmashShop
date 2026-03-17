// routes/payment.js
import express from 'express';
import qs from 'qs';
import crypto from 'crypto';
import { createPaymentUrl } from '../controllers/payment.controller.js';
const paymentRoutes = express.Router();
function sortObject(obj) {
    const sorted = {};
    Object.keys(obj).sort().forEach(key => (sorted[key] = obj[key]));
    return sorted;
};
paymentRoutes.post('/create_payment', createPaymentUrl);
paymentRoutes.get('/vnpay_return', (req, res) => {
        const query = req.query;
        // console.log(req.query, 'ád');
        const secureHash = query.vnp_SecureHash;
        delete query.vnp_SecureHash;
        delete query.vnp_SecureHashType;
    
        const sortedParams = sortObject(query);
        const signData = qs.stringify(sortedParams, { encode: false });
        const hmac = crypto.createHmac('sha512', process.env.VNP_HASH_SECRET);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    
        if (secureHash === signed) {
        // Thành công
        const FE_URL = process.env.FRONTEND_URL || 'https://smashshop.svuit.org';

            if (query.vnp_ResponseCode === '00') {
            return res.redirect(`${FE_URL}/payment-success?vnp_ResponseCode=00`);
            }
            return res.redirect(`${FE_URL}/payment-success?vnp_ResponseCode=${query.vnp_ResponseCode}`);

        } else {
        return res.status(400).send('Checksum failed');
        }
});
    
export default paymentRoutes;
