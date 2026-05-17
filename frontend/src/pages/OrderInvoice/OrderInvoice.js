import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiGetPublicInvoice } from '../../apis/order';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPrint, faArrowLeft, faEnvelope, faPhone, faMapMarkerAlt, faGlobe, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import './OrderInvoice.css';

const OrderInvoice = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchInvoice = async () => {
            try {
                const res = await apiGetPublicInvoice(id);
                if (res.success) {
                    setOrder(res.data);
                } else {
                    setError(res.message || 'Không thể tải thông tin hóa đơn.');
                }
            } catch (err) {
                console.error('Lỗi khi tải hóa đơn:', err);
                setError('Có lỗi xảy ra khi kết nối tới máy chủ.');
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            fetchInvoice();
        }
    }, [id]);

    const handlePrint = () => {
        window.print();
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="invoice-loading">
                <div className="spinner"></div>
                <p>Đang tải hóa đơn bán hàng...</p>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="invoice-error">
                <FontAwesomeIcon icon={faFileInvoiceDollar} className="error-icon" />
                <h2>Không tìm thấy hóa đơn</h2>
                <p>{error || 'Đơn hàng này không tồn tại hoặc đã bị xóa.'}</p>
                <button className="btn-back-home" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Quay về trang chủ
                </button>
            </div>
        );
    }

    return (
        <div className="invoice-page-container">
            {/* Top Toolbar (Hidden on Print) */}
            <div className="invoice-toolbar no-print">
                <button className="btn-toolbar-back" onClick={() => navigate('/')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                </button>
                <div className="toolbar-actions">
                    <button className="btn-toolbar-print" onClick={handlePrint}>
                        <FontAwesomeIcon icon={faPrint} /> In hóa đơn / Lưu PDF
                    </button>
                </div>
            </div>

            {/* Main Invoice Sheet */}
            <div className="invoice-sheet">
                {/* Stamp/Watermark based on Status */}
                <div className={`invoice-status-stamp stamp-${order.status?.toLowerCase()}`}>
                    {order.status === 'Succeeded' ? 'ĐÃ THANH TOÁN' :
                        order.status === 'Cancelled' ? 'ĐÃ HỦY ĐƠN' :
                            order.status === 'Pending' ? 'ĐANG CHỜ DUYỆT' :
                                order.status === 'Processing' ? 'ĐANG XỬ LÝ' : order.status?.toUpperCase()}
                </div>

                {/* Invoice Header */}
                <div className="invoice-header">
                    <div className="company-info">
                        <h1 className="company-logo">HCShop</h1>
                        <p className="company-tagline">Chuyên thiết bị và phụ kiện thể thao chính hãng</p>
                        <div className="company-details">
                            <p><FontAwesomeIcon icon={faMapMarkerAlt} /> 67/7 Trương Định, Khu vực Vĩnh Phú, Phường An Nhơn Bắc, Tỉnh Gia Lai</p>
                            <p><FontAwesomeIcon icon={faPhone} /> Hotline: 19008089</p>
                            <p><FontAwesomeIcon icon={faEnvelope} /> Email: support@hcshop.com</p>
                            <p><FontAwesomeIcon icon={faGlobe} /> Website: www.hcshop.com</p>
                        </div>
                    </div>
                    <div className="invoice-meta">
                        <div className="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
                        <div className="invoice-sub-title">SALES INVOICE</div>
                        <div className="meta-row">
                            <span className="meta-label">Mã đơn hàng:</span>
                            <span className="meta-value highlight">#{order.order_id || order._id}</span>
                        </div>
                        <div className="meta-row">
                            <span className="meta-label">Ngày đặt hàng:</span>
                            <span className="meta-value">{formatDate(order.createdAt)}</span>
                        </div>
                        <div className="meta-row">
                            <span className="meta-label">Trạng thái:</span>
                            <span className={`meta-value status-${order.status?.toLowerCase()}`}>
                                {order.status === 'Succeeded' ? 'Đã thanh toán (Thành công)' :
                                    order.status === 'Cancelled' ? 'Đã hủy đơn hàng' :
                                        order.status === 'Pending' ? 'Đang chờ thanh toán/duyệt' :
                                            order.status === 'Processing' ? 'Đang xử lý' : order.status}
                            </span>
                        </div>
                    </div>
                </div>

                <hr className="divider-double" />

                {/* Customer and Delivery Info Section */}
                <div className="invoice-info-section">
                    <div className="info-block">
                        <h3 className="section-title">THÔNG TIN KHÁCH HÀNG</h3>
                        <div className="info-row">
                            <span className="info-label">Khách hàng:</span>
                            <span className="info-value"><strong>{order.shipping.gender === 'Nữ' ? 'Bà' : 'Ông'} {order.shipping.name}</strong></span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Điện thoại:</span>
                            <span className="info-value">{order.shipping.phone}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Email:</span>
                            <span className="info-value">{order.shipping.email}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Địa chỉ:</span>
                            <span className="info-value">{order.shipping.address}</span>
                        </div>
                    </div>

                    <div className="info-block border-left">
                        <h3 className="section-title">THÔNG TIN GIAO NHẬN</h3>
                        <div className="info-row">
                            <span className="info-label">Phương thức nhận:</span>
                            <span className="info-value">{order.shipping.shipmethod || 'Giao hàng tận nơi'}</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Dịch vụ vận chuyển:</span>
                            <span className="info-value">Standard Delivery</span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Phương thức thanh toán:</span>
                            <span className="info-value">
                                {order.paymentmethod === 'cod'
                                    ? 'Thanh toán khi nhận hàng (COD)'
                                    : 'Thanh toán trực tuyến (VNPAY)'}
                            </span>
                        </div>
                        <div className="info-row">
                            <span className="info-label">Ghi chú giao nhận:</span>
                            <span className="info-value italic">{order.shipping.note || 'Không có ghi chú.'}</span>
                        </div>
                    </div>
                </div>

                {/* Items Table */}
                <div className="invoice-items-section">
                    <h3 className="section-title">CHI TIẾT SẢN PHẨM MUA SẮM</h3>
                    <table className="invoice-table">
                        <thead>
                            <tr>
                                <th style={{ width: '5%' }}>STT</th>
                                <th style={{ width: '55%' }}>Tên Sản Phẩm / Thuộc tính</th>
                                <th style={{ width: '10%', textAlign: 'center' }}>Số Lượng</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Đơn Giá</th>
                                <th style={{ width: '15%', textAlign: 'right' }}>Thành Tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items.map((item, index) => (
                                <tr key={index}>
                                    <td style={{ textAlign: 'center' }}>{index + 1}</td>
                                    <td>
                                        <div className="item-name">
                                            <strong>{item.product?.prod_name || 'Sản phẩm'}</strong>
                                        </div>
                                        {item.selected_variants && Object.keys(item.selected_variants).length > 0 && (
                                            <div className="item-variants">
                                                {Object.entries(item.selected_variants).map(([key, val]) => (
                                                    <span key={key} className="variant-tag">{key}: {val}</span>
                                                ))}
                                            </div>
                                        )}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                    <td style={{ textAlign: 'right' }}>{item.price.toLocaleString()}₫</td>
                                    <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}₫</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Totals Summary */}
                <div className="invoice-summary-section">
                    <div className="payment-note">
                        <p className="note-title">Cam kết & Chính sách đổi trả:</p>
                        <ul>
                            <li>Được kiểm tra hàng trước khi nhận và thanh toán.</li>
                            <li>Hỗ trợ đổi trả sản phẩm trong vòng 7 ngày nếu do lỗi sản xuất.</li>
                            <li>Vui lòng giữ lại hóa đơn này để được bảo hành sản phẩm chính hãng.</li>
                        </ul>
                    </div>
                    <div className="totals-block">
                        <div className="totals-row">
                            <span className="totals-label">Tạm tính:</span>
                            <span className="totals-value">{(order.total + (order.discount_amount || 0)).toLocaleString()}₫</span>
                        </div>
                        {order.discount_amount > 0 && (
                            <div className="totals-row discount">
                                <span className="totals-label">Giảm giá voucher:</span>
                                <span className="totals-value">-{order.discount_amount.toLocaleString()}₫</span>
                            </div>
                        )}
                        <hr className="divider-dotted" />
                        <div className="totals-row grand-total">
                            <span className="totals-label">TỔNG TIỀN CẦN THANH TOÁN:</span>
                            <span className="totals-value">{order.total.toLocaleString()}₫</span>
                        </div>
                    </div>
                </div>

                {/* Signatures / Foot */}
                <div className="invoice-signatures">
                    <div className="signature-box">
                        <p className="signature-title">Người mua hàng</p>
                        <p className="signature-note">(Ký, ghi rõ họ tên)</p>
                        <div className="signature-space"></div>
                        <p className="signature-name">{order.shipping.name}</p>
                    </div>
                    <div className="signature-box">
                        <p className="signature-title">Người lập hóa đơn</p>
                        <p className="signature-note">(Ký, đóng dấu đại diện)</p>
                        {/* <div className="signature-space">
                            <div className="stamp-circle">
                                <span>HCSHOP</span>
                                <span className="stamp-center">ĐÃ THU TIỀN</span>
                            </div>
                        </div>
                        <p className="signature-name">Bộ phận bán hàng</p> */}
                    </div>
                </div>

                <div className="invoice-footer">
                    <p className="thank-you">CẢM ƠN QUÝ KHÁCH ĐÃ MUA SẮM TẠI HCSHOP!</p>
                    <p className="footer-tagline">Hẹn gặp lại quý khách lần mua sắm tiếp theo.</p>
                </div>
            </div>
        </div>
    );
};

export default OrderInvoice;
