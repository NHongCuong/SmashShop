import { useEffect,useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrderThunk } from '../../app/store/orderThunk';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';

export default function PaymentSuccess() {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const hasHandled = useRef(false);

    useEffect(() => {
      if (hasHandled.current) return;
      hasHandled.current = true;

      const params = new URLSearchParams(window.location.search);
      const responseCode = params.get('vnp_ResponseCode');
      console.log(responseCode, "responseCode")
      
      if (responseCode === '00') {
        const shipping = JSON.parse(localStorage.getItem('shippingInfo'));
        const cartItems = JSON.parse(localStorage.getItem('cartItems') || '[]');
        console.log(cartItems," fdsa")
        if (!shipping || cartItems.length === 0) {
          Swal.fire({
            icon: 'error',
            title: 'Không tìm thấy thông tin đơn hàng.',
            timer: 1500,
            showConfirmButton: false
          });
          navigate('/');
          return;
        }
  
        const items = cartItems.map(i => ({
          product: i.product._id,
          quantity: i.quantity
        }));
  
        const orderData = {
          shipping,
          items,
          paymentMethod: 'vnpay'
        };
  
        dispatch(createOrderThunk(orderData));
        console.log(orderData, "orderData");
        Swal.fire({
          icon: 'success',
          title: 'Thanh toán thành công! Đơn hàng đã được tạo.',
          timer: 1500,
          showConfirmButton: true
        });
  
        // Xoá thông tin sau khi hoàn tất
        localStorage.removeItem('shippingInfo');
        localStorage.removeItem('cartItems');
        navigate('/');
        return;
      } else
      {

        Swal.fire({
          icon: 'error',
          title: 'Thanh toán thất bại hoặc bị hủy.',
          timer: 500000,
          showConfirmButton: true
        });
        // navigate('/cart');
      }
    }, []);

  return <div>Đang xử lý thanh toán...</div>;
}
