import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import { useState, useMemo } from "react";
import "./Order.css";
import { useDispatch, useSelector } from "react-redux";
import { createOrderThunk } from "../../app/store/orderThunk";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";

const EMPTY_CART = [];

export default function Cart() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart?.cart || EMPTY_CART);

  // Check if this is a "Buy Now" flow or coming from Cart with voucher
  const buyNowItem = location.state?.buyNowItem || null;
  const stateCartItems = location.state?.cartItems || null;
  const stateTotalPrice = location.state?.totalPrice || null;
  const stateDiscountAmount = location.state?.discountAmount || 0;
  const stateFinalPrice = location.state?.finalPrice || null;
  const appliedVoucher = location.state?.appliedVoucher || null;

  // Determine which items to display in the order
  const orderItems = useMemo(() => {
    if (buyNowItem) {
      return [buyNowItem];
    }
    if (stateCartItems) {
      return stateCartItems;
    }
    return cartItems;
  }, [buyNowItem, stateCartItems, cartItems]);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod'); // cod | vnpay

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const total = stateTotalPrice !== null
    ? stateTotalPrice
    : orderItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const discount = stateDiscountAmount;
  const finalTotal = stateFinalPrice !== null ? stateFinalPrice : (total - discount);

  const handleSubmit = async () => {
    const requiredShippingFields = ['name', 'address', 'phone', 'email'];
    for (let field of requiredShippingFields) {
      if (!formData[field]) {
        Swal.fire({
          icon: 'error',
          title: `Vui lòng nhập đầy đủ thông tin`,
          showConfirmButton: false,
          timer: 1000
        });
        return;
      }
    }

    // Validation regex
    const phoneRegex = /^\d{10}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!phoneRegex.test(formData.phone)) {
      Swal.fire({
        icon: 'error',
        title: 'Số điện thoại không hợp lệ',
        text: 'Số điện thoại phải bao gồm đúng 10 chữ số.',
        timer: 2000
      });
      return;
    }

    if (!emailRegex.test(formData.email)) {
      Swal.fire({
        icon: 'error',
        title: 'Email không hợp lệ',
        text: 'Vui lòng nhập đúng định dạng email (ví dụ: abc@gmail.com).',
        timer: 2000
      });
      return;
    }

    // Check if order items are empty
    if (orderItems.length === 0) {
      Swal.fire({
        icon: 'error',
        title: "Không có sản phẩm nào để đặt hàng.",
        showConfirmButton: false,
        timer: 1000
      });
      return;
    }

    const shipping = { ...formData };
    const items = orderItems.map(i => ({
      product: i.product._id,
      quantity: i.quantity,
      variants: i.selected_variants || i.variants // Handle both cart and buyNow formats
    }));

    const orderData = {
      shipping,
      items,
      paymentMethod: paymentMethod,
      isBuyNow: !!buyNowItem,
      voucher_id: appliedVoucher?._id || null,
      discountAmount: discount
    };


    if (paymentMethod === 'cod') {
      try {
        await dispatch(createOrderThunk(orderData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: "Đơn hàng của bạn đã được đặt thành công.",
          showConfirmButton: false,
          timer: 1000
        });
        navigate('/');
      } catch (err) {
        Swal.fire({
          icon: 'error',
          title: 'Đặt hàng thất bại',
          text: err || 'Có lỗi xảy ra, vui lòng thử lại.',
          showConfirmButton: true,
        });
      }
    } else if (paymentMethod === 'vnpay') {
      try {
        // Bước 1: Tạo đơn hàng trước để kiểm tra tồn kho atomic
        // Nếu tồn kho không đủ, createOrderThunk sẽ reject với message lỗi
        const orderResult = await dispatch(createOrderThunk(orderData)).unwrap();

        // Bước 2: Tạo đơn thành công -> lấy order ID rồi gọi API tạo payment URL
        const createdOrderId = orderResult._id;

        const res = await fetch("http://localhost:5001/api/v1/vnpay/create_payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalTotal,
            orderId: createdOrderId,
          }),
        });
        const data = await res.json();
        if (data.paymentUrl) {
          // Lưu orderId để xử lý khi quay lại từ VNPAY
          localStorage.setItem("pendingVnpayOrderId", createdOrderId);
          window.location.href = data.paymentUrl;
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Lỗi thanh toán',
            text: 'Không thể tạo liên kết thanh toán online.',
            showConfirmButton: true,
          });
        }
      } catch (err) {
        // Hiển thị lỗi tồn kho hoặc lỗi khác giống COD
        Swal.fire({
          icon: 'error',
          title: 'Đặt hàng thất bại',
          text: err || 'Một số sản phẩm không đủ số lượng trong kho',
          showConfirmButton: true,
        });
      }
    }
  };

  return (
    <>
      <Header />

      <div className="user-container">
        <div className="user-header-container">
          <p className="user-header">TRANG CHỦ {'>'} {buyNowItem ? 'MUA NGAY' : 'GIỎ HÀNG'}</p>
        </div>

        <div className="order-container">
          <div className="order-form">
            <h3>Thông tin đặt hàng</h3>
            {['name', 'address', 'phone', 'email', 'note'].map(field => (
              <div key={field}>
                <label>{field === 'note' ? 'Ghi chú' : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                {field === 'note'
                  ? <textarea name={field} onChange={handleChange} />
                  : <input name={field} onChange={handleChange} />
                }
              </div>
            ))}

            <div className="payment-method">
              <p className="payment-method-title">Phương thức thanh toán:</p>
              <div>
                <div>
                  <input
                    type="radio"
                    id="cod"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                  />
                  <label htmlFor="cod">Thanh toán khi nhận hàng</label>
                </div>
                <div>
                  <input
                    type="radio"
                    id="vnpay"
                    name="paymentMethod"
                    value="vnpay"
                    checked={paymentMethod === 'vnpay'}
                    onChange={() => setPaymentMethod('vnpay')}
                  />
                  <label htmlFor="vnpay">Thanh toán qua VNPAY</label>
                </div>
              </div>
            </div>
          </div>

          <div className="order-summary">
            <h3>Đơn hàng</h3>
            {orderItems.map(item => (
              <div key={item.product._id} className="order-item">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span>{item.product.prod_name} ×{item.quantity}</span>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {item.selected_variants && Object.entries(item.selected_variants).map(([name, value]) => (
                      <span key={name} style={{ marginRight: '10px' }}>{name}: {value}</span>
                    ))}
                    {(item.variants && !item.selected_variants) && Object.entries(item.variants).map(([name, value]) => (
                      <span key={name} style={{ marginRight: '10px' }}>{name}: {value}</span>
                    ))}
                  </div>
                </div>
                <span>{(item.product.price * item.quantity).toLocaleString()} đ</span>
              </div>
            ))}
            <div className="order-total-detail">
              <div className="total-row">
                <span>Tạm tính</span>
                <span>{total.toLocaleString()} đ</span>
              </div>
              {discount > 0 && (
                <div className="total-row discount">
                  <span>Giảm giá {appliedVoucher ? `(${appliedVoucher.discount_percent}%)` : ''}</span>
                  <span>-{discount.toLocaleString()} đ</span>
                </div>
              )}
              <div className="order-total">
                <span>Tổng đơn</span>
                <span className="total-amount">{finalTotal.toLocaleString()} đ</span>
              </div>
            </div>
            <button
              className="order-button"
              onClick={handleSubmit}
            >
              {paymentMethod === 'cod' ? 'Đặt hàng' : 'Thanh toán online'}
            </button>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
