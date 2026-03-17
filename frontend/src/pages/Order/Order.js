import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import { useState } from "react";
import "./Order.css";
import { useDispatch, useSelector } from "react-redux";
import { createOrderThunk } from "../../app/store/orderThunk";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

export default function Cart() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart?.cart || []);

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

  // const discountAmount = 300000;
  const total = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);
  const finalTotal = total;

  const handleSubmit = async () => {
    const requiredShippingFields = ['name', 'address', 'phone', 'email'];
    for (let field of requiredShippingFields) {
      if (!formData[field]) {
        Swal.fire({
                  icon: 'failure',
                  title: `Vui lòng nhập đầy đủ thông tin`,
                  showConfirmButton: false,
                  timer: 1000
                });
        return;
      }
    }
  
    // Check if the cart is empty
    if (cartItems.length === 0) {
      Swal.fire({
        icon: 'failure',
        title: "Giỏ hàng của bạn đang trống. Vui lòng thêm sản phẩm vào giỏ.",
        showConfirmButton: false,
        timer: 1000
      });
      return;
    }

    const shipping = { ...formData };
    const items = cartItems.map(i => ({
      product: i.product._id,
      quantity: i.quantity
    }));

    const orderData = {
      shipping,
      items,
      paymentMethod: paymentMethod
    };


    if (paymentMethod === 'cod') {
      dispatch(createOrderThunk(orderData));
      Swal.fire({
        icon: 'failure',
        title: "Đơn hàng của bạn đã được đặt thành công.",
        showConfirmButton: false,
        timer: 1000
      });
      navigate('/');
    } else if (paymentMethod === 'vnpay') {
      try {
        const res = await fetch("https://smashshop.svuit.org/api/v1/vnpay/create_payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: finalTotal,
            orderId: Date.now().toString(),
          }),
        });
        const data = await res.json();
        if (data.paymentUrl) {
          localStorage.setItem("shippingInfo", JSON.stringify(formData));
          localStorage.setItem("cartItems", JSON.stringify(items));
          
          window.location.href = data.paymentUrl;
        } else {
          alert("Không thể tạo thanh toán online.");
        }
      } catch (err) {
        console.error(err);
        alert("Lỗi kết nối cổng thanh toán.");
      }
    }
  };

  return (
    <>
      <Header  />

      <div className="user-container">
        <div className="user-header-container">
          <p className="user-header">TRANG CHỦ {'>'} GIỎ HÀNG</p>
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
            {cartItems.map(item => (
              <div key={item.product._id} className="order-item">
                <span>{item.product.prod_name} ×{item.quantity}</span>
                <span>{item.product.price.toLocaleString()} đ</span>
              </div>
            ))}
            <div className="order-total">
              <span>Tổng đơn</span>
              <span className="total-amount">{finalTotal.toLocaleString()} đ</span>
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