import request from 'supertest';
import { expect } from 'chai';
import app from '../server.js';

describe('VNPAY Payment Routes', () => {
    it('should create a payment url', async () => {
        const res = await request(app)
            .post('/api/v1/vnpay/create_payment')
            .send({
                amount: 3900000,
                orderId: 'test123'
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('paymentUrl');
        expect(res.body.paymentUrl).to.include('vnp_Amount');
    });

    it('should fail checksum if tampered', async () => {
        const res = await request(app)
            .get('/api/v1/vnpay/vnpay_return')
            .query({
                vnp_Amount: '390000000',
                vnp_Command: 'pay',
                vnp_ResponseCode: '00',
                vnp_SecureHash: 'invalidhash'
            });

        expect(res.status).to.equal(400);
        expect(res.text).to.include('Checksum failed');
    });
});
