import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { apiGetOrderById } from '../../apis/order';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const responseCode = params.get('vnp_ResponseCode');
    const orderIdFromUrl = params.get('orderId');
    const orderId = orderIdFromUrl || localStorage.getItem('pendingVnpayOrderId');

    if (responseCode === '00') {
      const handleSuccess = async () => {
        try {
            let orderData = null;
            if (orderId) {
                const res = await apiGetOrderById(orderId);
                if (res.success) {
                    orderData = res.data;
                }
            }

            Swal.fire({
                icon: 'success',
                title: "Đơn hàng của bạn đã được đặt thành công.",
                text: 'Cảm ơn bạn đã mua sắm tại SmashShop!',
                timer: 2000,
                showConfirmButton: false
            });

            localStorage.removeItem('pendingVnpayOrderId');
            
            if (orderData) {
                // Đảm bảo navigation xảy ra sau khi Swal chuẩn bị đóng
                setTimeout(() => {
                    navigate('/order-success', { state: { order: orderData } });
                }, 1500);
            } else {
                navigate('/');
            }
        } catch (error) {
            console.error("Error fetching order:", error);
            navigate('/');
        }
      };
      
      handleSuccess();
      return;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Thanh toán thất bại hoặc bị hủy.',
        text: 'Đơn hàng đã được huỷ và tồn kho đã được khôi phục.',
        confirmButtonText: 'Quay lại trang chủ'
      }).then(() => {
        localStorage.removeItem('pendingVnpayOrderId');
        navigate('/');
      });
      return;
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
        <h2>Đang xử lý thanh toán...</h2>
    </div>
  );
}
