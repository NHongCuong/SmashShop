import Header from "../../components/Header/Header";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useGetVouchersQuery } from "../../features/services/voucherApi";
import "./Cart.css";
import { useDispatch, useSelector } from "react-redux";
import { removeCartItemThunk, changeCartItemThunk } from "../../app/store/cartThunks";
import Footer from "../../components/Footer/Footer";

const formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN') + ' đ';
};

const getDiscountedPrice = (product) => {
  if (product.discount > 0) {
    return Math.round(product.price * (1 - product.discount / 100));
  }
  return product.price;
};

const EMPTY_CART = [];

export default function Cart() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  const dispatch = useDispatch();
  const cartItemsWithDetails = useSelector(state => state.cart?.cart || EMPTY_CART);

  const [voucherCode, setVoucherCode] = useState("");
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const { data: vouchers = [] } = useGetVouchersQuery();

  // console.log("detail",cartItemsWithDetails);
  const handleQuantityChange = (productId, changeAmount) => {
    const item = cartItemsWithDetails.find(item => item.product._id === productId);
    if (!item) return;
  
    const newQuantity = item.quantity + changeAmount;
    const stock = item.product.stock;

    // Không cho tăng vượt quá số lượng tồn kho
    if (changeAmount > 0 && stock !== undefined && newQuantity > stock) {
      return;
    }
  
    if (newQuantity < 1) {
      dispatch(removeCartItemThunk(productId));
    } else {
      dispatch(changeCartItemThunk({
        product_id: productId,
        quantity: newQuantity,
      }));
    }
  };
  
  
  const handleRemove = (productId) => {
    dispatch(removeCartItemThunk({
      product_id: productId
    }));
  };

  const handleCheckout = () => {
    if (cartItemsWithDetails.length === 0) {
      alert("Giỏ hàng của bạn đang trống.");
      return;
    }
    navigate('/order', { 
      state: { 
        cartItems: cartItemsWithDetails,
        totalPrice,
        discountAmount,
        finalPrice,
        appliedVoucher 
      } 
    });
  };

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      alert("Vui lòng nhập mã giảm giá.");
      return;
    }

    const voucher = vouchers.find(
      (v) => v.voucher_name.toLowerCase() === voucherCode.trim().toLowerCase()
    );

    if (voucher) {
      // Kiểm tra xem có sản phẩm nào trong giỏ hàng áp dụng mã này không
      const isEligible = cartItemsWithDetails.some(item => {
        const productVoucherId = item.product.voucher_id?._id || item.product.voucher_id;
        return productVoucherId === voucher._id;
      });

      if (isEligible) {
        setAppliedVoucher(voucher);
        alert(`Áp dụng mã giảm giá thành công! Giảm ${voucher.discount_percent}% cho các sản phẩm hợp lệ.`);
      } else {
        setAppliedVoucher(null);
        alert("Mã giảm giá này không áp dụng cho các sản phẩm trong giỏ hàng của bạn.");
      }
    } else {
      setAppliedVoucher(null);
      alert("Mã giảm giá không hợp lệ.");
    }
  };


  const totalQuantity = cartItemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItemsWithDetails.reduce((sum, item) => sum + item.quantity * getDiscountedPrice(item.product), 0);
  
  // Tính tiền giảm giá chỉ cho các sản phẩm có voucher_id khớp với appliedVoucher
  const discountAmount = appliedVoucher 
    ? cartItemsWithDetails.reduce((sum, item) => {
        const productVoucherId = item.product.voucher_id?._id || item.product.voucher_id;
        if (productVoucherId === appliedVoucher._id) {
          return sum + (item.quantity * getDiscountedPrice(item.product) * appliedVoucher.discount_percent) / 100;
        }
        return sum;
      }, 0)
    : 0;

  const finalPrice = totalPrice - discountAmount;


  return (

    <>
      <Header/>

      <div className="user-container">
        <div className="user-header-container">
          <p className="user-header">TRANG CHỦ {'>'} GIỎ HÀNG</p>
        </div>
        <div className="cart-table">
        <div className="cart-header">
          <span>Sản phẩm</span>
          <span>Đơn giá</span>
          <span>Số lượng</span>
          <span>Thành tiền</span>
        </div>

        {cartItemsWithDetails.map(item => (
          <div className="cart-item" key={item.product._id}>
            
            <div className="product-info">
              <img src={item.product.image?.[0] || ''} alt={item.product.prod_name} />

              <span>{item.product.prod_name}</span>
              {appliedVoucher && (item.product.voucher_id?._id === appliedVoucher._id || item.product.voucher_id === appliedVoucher._id) && (
                <span className="voucher-tag" style={{ color: 'green', fontSize: '0.8rem', marginLeft: '5px' }}>
                  (-{appliedVoucher.discount_percent}%)
                </span>
              )}
            </div>
            <div>
              {item.product.discount > 0 ? (
                <>
                  <span style={{ color: '#e44d26', fontWeight: 'bold' }}>{formatCurrency(getDiscountedPrice(item.product))}</span>
                  <br />
                  <span style={{ color: '#999', textDecoration: 'line-through', fontSize: '0.85rem' }}>{formatCurrency(item.product.price)}</span>
                </>
              ) : (
                <span>{formatCurrency(item.product.price)}</span>
              )}
            </div>
            <div className="quantity-control">
              <button onClick={() => handleQuantityChange(item.product._id, -1)}>-</button>
              <span>{item.quantity}</span>
              <button
                onClick={() => handleQuantityChange(item.product._id, 1)}
                disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}
              >+</button>
            </div>
            <div>{formatCurrency(getDiscountedPrice(item.product) * item.quantity)}</div>
            <button className="delete-button" onClick={() => handleRemove(item.product._id)}>Xóa</button>
          </div>
        ))}

        <div className="total-price">
          Tổng tiền: <strong>{formatCurrency(totalPrice)}</strong>
        </div>
      </div>

      <div className="bottom-section">
        <div className="discount-box">
          <label>Mã giảm giá</label>
          <input 
            type="text" 
            placeholder="Nhập mã giảm giá" 
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value)}
          />
          <button onClick={handleApplyVoucher}>ÁP DỤNG</button>
        </div>
        <div className="summary-box">
          <p><strong>Số lượng:</strong> {totalQuantity}</p>
          <p><strong>Thành tiền:</strong> {formatCurrency(totalPrice)}</p>
          {appliedVoucher && (
            <p className="discount-text">
              <strong>Giảm giá ({appliedVoucher.discount_percent}%):</strong> -{formatCurrency(discountAmount)}
            </p>
          )}
          <p className="final-total"><strong>Tổng cộng:</strong> {formatCurrency(finalPrice)}</p>
          <button className="checkout-button"  onClick={() => handleCheckout()}>THANH TOÁN</button>
        </div>
      </div>

      </div>
      <Footer/>
    </>
  );
}
