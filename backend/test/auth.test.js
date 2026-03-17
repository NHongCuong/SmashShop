import request from 'supertest';
import { expect } from 'chai';
import app from '../server.js';

describe('Auth Routes', () => {
    it('should login successfully with valid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({
                email: 'phongbui22012004@gmail.com',
                password: '123456'
            });

        expect(res.status).to.equal(200);
        expect(res.body).to.have.property('token');
        expect(res.body).to.have.property('user');
    });

    it('should fail login with invalid credentials', async () => {
        const res = await request(app)
            .post('/api/v1/users/login')
            .send({
                email: 'wrong@example.com',
                password: 'wrongpass'
            });

        expect(res.status).to.equal(400); // hoặc 400 tùy backend
        expect(res.body).to.have.property('message');
    });
});