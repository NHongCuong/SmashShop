import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;

    const params = new URLSearchParams(window.location.search);
    const responseCode = params.get('vnp_ResponseCode');

    if (responseCode === '00') {
      Swal.fire({
        icon: 'success',
        title: 'Thanh toán thành công! Đơn hàng đã được ghi nhận.',
        timer: 1500,
        showConfirmButton: true
      });

      // Xoá thông tin tạm sau khi hoàn tất
      localStorage.removeItem('pendingVnpayOrderId');
      navigate('/');
      return;
    } else {
      Swal.fire({
        icon: 'error',
        title: 'Thanh toán thất bại hoặc bị hủy.',
        text: 'Đơn hàng đã được huỷ và tồn kho đã được khôi phục.',
        showConfirmButton: true
      });

      localStorage.removeItem('pendingVnpayOrderId');
      navigate('/');
      return;
    }
  }, []);

  return <div>Đang xử lý thanh toán...</div>;
}
