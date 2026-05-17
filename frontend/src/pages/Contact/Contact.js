import React, { useState } from 'react';
import './Contact.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPhone, faEnvelope, faLocationDot, faClock } from '@fortawesome/free-solid-svg-icons';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import api from '../../apis/axios';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await api.post('/api/v1/contacts', formData);
            if (response.success) {
                setStatus({ type: 'success', message: response.message });
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                });
            }
        } catch (error) {
            setStatus({ 
                type: 'error', 
                message: error.response?.data?.message || 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Header />
            <div className="contact-page-wrapper">
                <div className="contact-container">
                    <div className="contact-header">
                        <h1>Liên Hệ Với Chúng Tôi</h1>
                        <p>Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn 24/7</p>
                    </div>

                    <div className="contact-content">
                        <div className="contact-info">
                            <div className="info-item">
                                <div className="info-icon">
                                    <FontAwesomeIcon icon={faPhone} />
                                </div>
                                <div className="info-text">
                                    <h3>Số Điện Thoại</h3>
                                    <p>0557-843-408</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <FontAwesomeIcon icon={faEnvelope} />
                                </div>
                                <div className="info-text">
                                    <h3>Email</h3>
                                    <p>hcshop@gmail.com</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <FontAwesomeIcon icon={faLocationDot} />
                                </div>
                                <div className="info-text">
                                    <h3>Địa Chỉ</h3>
                                    <p>67/7 Trương Định, Khu vực Vĩnh Phúm Phường An Nhơn Bắc, Tỉnh Gia Lai</p>
                                </div>
                            </div>

                            <div className="info-item">
                                <div className="info-icon">
                                    <FontAwesomeIcon icon={faClock} />
                                </div>
                                <div className="info-text">
                                    <h3>Giờ Làm Việc</h3>
                                    <p>Thứ 2 - Thứ 7: 8:00 - 21:00</p>
                                    <p>Chủ Nhật: 9:00 - 18:00</p>
                                </div>
                            </div>
                        </div>

                        <div className="contact-form-container">
                            <form className="contact-form" onSubmit={handleSubmit}>
                                <h2>Gửi Tin Nhắn</h2>
                                {status.message && (
                                    <div className={`status-message ${status.type}`}>
                                        {status.message}
                                    </div>
                                )}
                                <div className="form-group">
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="Họ và tên" 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="Email" 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="Số điện thoại" 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <input 
                                        type="text" 
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        placeholder="Chủ đề" 
                                        required 
                                    />
                                </div>
                                <div className="form-group">
                                    <textarea 
                                        name="message"
                                        value={formData.message}
                                        onChange={handleChange}
                                        placeholder="Nội dung tin nhắn" 
                                        rows="5" 
                                        required
                                    ></textarea>
                                </div>
                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? 'Đang gửi...' : 'Gửi Liên Hệ'}
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="contact-map">
                        <iframe 
                            title="SmashShop Location"
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.485398611094!2d106.770624074858!3d10.8506373893026!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3175270ad23039d7%3A0x7d02008779603099!2zNCBFaW5zdGVpbiwgQsOsbmggVGjhu40sIFRo4bunIMSQ4bupYywgVGjDoG5oIHBo4buRIEjhu5MgQ2jDrSBNaW5oLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1715260000000!5m2!1svi!2s" 
                            width="100%" 
                            height="450" 
                            style={{ border: 0 }} 
                            allowFullScreen="" 
                            loading="lazy"
                        ></iframe>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    );
};

export default Contact;
