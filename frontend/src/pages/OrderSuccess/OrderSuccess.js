import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faListAlt, faTimes, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';
import './OrderSuccess.css';
import Swal from 'sweetalert2';
import { apiGetOrderById, apiUpdateOrderStatus } from '../../apis/order';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(!order);
    const hasHandledVnpay = useRef(false);

    useEffect(() => {
        const fetchOrder = async () => {
            const params = new URLSearchParams(location.search);
            const orderIdFromUrl = params.get('orderId');
            const responseCode = params.get('vnp_ResponseCode');
            const orderIdFromStorage = localStorage.getItem('pendingVnpayOrderId');
            const effectiveOrderId = orderIdFromUrl || orderIdFromStorage;

            console.log("OrderSuccess - location.search:", location.search);
            console.log("OrderSuccess - effectiveOrderId:", effectiveOrderId);

            // Handle VNPAY notifications once
            if (responseCode && !hasHandledVnpay.current) {
                hasHandledVnpay.current = true;
                if (responseCode === '00') {
                    Swal.fire({
                        icon: 'success',
                        title: "Đơn hàng của bạn đã được đặt thành công.",
                        text: 'Cảm ơn bạn đã mua sắm tại SmashShop!',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    
                    // Clear query params to avoid showing Swal again on refresh
                    const newUrl = location.pathname + (effectiveOrderId ? `?orderId=${effectiveOrderId}` : '');
                    window.history.replaceState(null, '', newUrl);
                    localStorage.removeItem('pendingVnpayOrderId'); // Dọn dẹp storage
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Thanh toán thất bại hoặc bị hủy.',
                        text: 'Đơn hàng đã được huỷ và tồn kho đã được khôi phục.',
                        confirmButtonText: 'Quay lại trang chủ'
                    }).then(() => {
                        navigate('/');
                    });
                    localStorage.removeItem('pendingVnpayOrderId');
                    return;
                }
            }

            if (!order && effectiveOrderId) {
                try {
                    const res = await apiGetOrderById(effectiveOrderId);
                    if (res.success) {
                        setOrder(res.data);
                    }
                } catch (error) {
                    console.error("Error fetching order in OrderSuccess:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [order, location.search, location.pathname, navigate]);

    if (loading) {
        return (
            <div className="order-success-wrapper">
                <Header />
                <div className="order-success-container no-order">
                    <h2>Đang tải thông tin đơn hàng...</h2>
                </div>
                <Footer />
            </div>
        );
    }

    if (!order) {
        return (
            <div className="order-success-wrapper">
                <Header />
                <div className="order-success-container no-order">
                    <h2>Không tìm thấy thông tin đơn hàng</h2>
                    <button className="btn-home" onClick={() => navigate('/')}>Quay về trang chủ</button>
                </div>
                <Footer />
            </div>
        );
    }

    const handleCancelOrder = async () => {
        const result = await Swal.fire({
            title: 'Xác nhận hủy đơn hàng?',
            text: "Bạn có chắc chắn muốn hủy đơn hàng này?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Hủy đơn',
            cancelButtonText: 'Quay lại'
        });

        if (result.isConfirmed) {
            try {
                await apiUpdateOrderStatus({ order_id: order._id, status: 'Cancelled' });
                Swal.fire(
                    'Đã hủy!',
                    'Đơn hàng của bạn đã được hủy thành công.',
                    'success'
                );
                navigate('/user/orders');
            } catch (error) {
                Swal.fire(
                    'Lỗi!',
                    'Không thể hủy đơn hàng. Vui lòng thử lại sau.',
                    'error'
                );
            }
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `Tháng ${date.getMonth() + 1} ${date.getDate()}, ${date.getFullYear()}`;
    };

    return (
        <div className="order-success-wrapper">
            <Header />
            <div className="order-success-content">
                <div className="success-header">
                    <FontAwesomeIcon icon={faCheckCircle} className="success-icon" />
                    <h1>Đã Đặt Hàng Thành Công!</h1>
                </div>
                <p className="thank-you-msg">
                    Cảm ơn bạn, <strong>{order.shipping.name}</strong>, đã cho SmashShop cơ hội phục vụ bạn.
                </p>

                <div className="order-info-card">
                    <div className="order-info-header">
                        <div className="order-id-group">
                            <strong>Đơn hàng: #{order.order_id || order._id.substring(0, 8).toUpperCase()}</strong>
                        </div>
                        <div className="order-actions">
                            <button className="btn-manage" onClick={() => navigate('/user/orders')}>
                                <FontAwesomeIcon icon={faListAlt} /> Quản lý đơn hàng
                            </button>
                            <button className="btn-invoice" onClick={() => navigate(`/order-invoice/${order._id}`)}>
                                <FontAwesomeIcon icon={faFileInvoiceDollar} /> Xuất hóa đơn
                            </button>
                            {order.status !== 'Cancelled' && (
                                <button className="btn-cancel" onClick={handleCancelOrder}>
                                    <FontAwesomeIcon icon={faTimes} /> Hủy
                                </button>
                            )}
                        </div>
                    </div>

                    <ul className="order-details-list">
                        <li>
                            <span className="label">Ngày đặt hàng:</span>
                            <span className="value">{formatDate(order.createdAt)}</span>
                        </li>
                        <li>
                            <span className="label">Tên Khách hàng:</span>
                            <span className="value">{order.shipping.gender === 'Nữ' ? 'Bà' : 'Ông'} {order.shipping.name}</span>
                        </li>
                        <li>
                            <span className="label">Số điện thoại:</span>
                            <span className="value">{order.shipping.phone}</span>
                        </li>
                        <li>
                            <span className="label">Email:</span>
                            <span className="value">{order.shipping.email}</span>
                        </li>
                        <li>
                            <span className="label">Địa chỉ giao hàng:</span>
                            <span className="value">{order.shipping.address}</span>
                        </li>
                        <li>
                            <span className="label">Tổng:</span>
                            <span className="value price">{order.total.toLocaleString()}₫</span>
                        </li>
                        <li>
                            <span className="label">Phương thức thanh toán:</span>
                            <span className="value">{order.paymentmethod === 'cod' ? 'Thanh toán khi nhận hàng' : 'Thanh toán online (VNPAY)'}</span>
                        </li>
                        <li>
                            <span className="label">Phương thức giao nhận:</span>
                            <span className="value">{order.shipping.shipmethod || 'Giao hàng tận nơi'}</span>
                        </li>
                        <li>
                            <span className="label">Dịch vụ vận chuyển:</span>
                            <span className="value">Standard Delivery</span>
                        </li>
                        <li>
                            <span className="label">Trạng thái:</span>
                            <span className={`value status-${order.status?.toLowerCase()}`}>
                                {order.status === 'Succeeded' ? 'Thành công' : 
                                 order.status === 'Pending' ? 'Đang xử lý' : 
                                 order.status === 'Cancelled' ? 'Đã hủy' : 
                                 order.status === 'Processing' ? 'Đang xử lý' : order.status}
                            </span>
                        </li>
                        <li>
                            <span className="label">Các yêu cầu khác:</span>
                            <span className="value">{order.shipping.note || 'Không có'}</span>
                        </li>
                    </ul>

                    <div className="order-products-list">
                        <div className="products-list-title">Danh sách sản phẩm</div>
                        <div className="products-table-wrapper">
                            <table className="products-table">
                                <thead>
                                    <tr>
                                        <th>Sản phẩm</th>
                                        <th style={{ textAlign: 'center' }}>Số lượng</th>
                                        <th style={{ textAlign: 'right' }}>Đơn giá</th>
                                        <th style={{ textAlign: 'right' }}>Thành tiền</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {order.items.map((item, index) => (
                                        <tr key={index}>
                                            <td>
                                                <div className="prod-name-cell">
                                                    <strong>{item.product?.prod_name || 'Sản phẩm'}</strong>
                                                    {item.selected_variants && (
                                                        <div className="prod-variants">
                                                            {Object.entries(item.selected_variants).map(([k, v]) => (
                                                                <span key={k}>{k}: {v}</span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>{item.quantity}</td>
                                            <td style={{ textAlign: 'right' }}>{item.price.toLocaleString()}₫</td>
                                            <td style={{ textAlign: 'right' }}>{(item.price * item.quantity).toLocaleString()}₫</td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr>
                                        <td colspan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Tạm tính:</td>
                                        <td style={{ textAlign: 'right' }}>{(order.total + (order.discount_amount || 0)).toLocaleString()}₫</td>
                                    </tr>
                                    {order.discount_amount > 0 && (
                                        <tr>
                                            <td colspan="3" style={{ textAlign: 'right', fontWeight: 'bold' }}>Giảm giá:</td>
                                            <td style={{ textAlign: 'right', color: '#d32f2f' }}>-{order.discount_amount.toLocaleString()}₫</td>
                                        </tr>
                                    )}
                                    <tr>
                                        <td colspan="3" style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '18px' }}>Tổng cộng:</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', fontSize: '18px', color: '#4caf50' }}>{order.total.toLocaleString()}₫</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default OrderSuccess;
