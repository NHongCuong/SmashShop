import Header from "../../components/Header/Header";
import { useEffect} from "react";
import { useNavigate} from "react-router-dom";
import "./Cart.css";
import { useDispatch, useSelector } from "react-redux";
import { changeCartItemThunk, fetchCartThunk, removeCartItemThunk } from "../../app/store/cartThunks";
import Footer from "../../components/Footer/Footer";

const formatCurrency = (amount) => {
  return amount.toLocaleString('vi-VN') + ' đ';
};


export default function Cart() {
  const isAuthenticated = useSelector(state => state.auth.isAuthenticated);
  const navigate = useNavigate();
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);
  const dispatch = useDispatch();
  // console.log(isAuthenticated)
    // const cart = useSelector(state => state.cart);
  // console.log("cart: ",cart);
  const cartItemsWithDetails = useSelector(state => state.cart?.cart || []);

  // console.log("detail",cartItemsWithDetails);
  const handleQuantityChange = (productId, changeAmount) => {
    const item = cartItemsWithDetails.find(item => item.product._id === productId);
    if (!item) return;
  
    const newQuantity = item.quantity + changeAmount;
  
    if (newQuantity < 1) {
      // Có thể yêu cầu xác nhận xoá luôn nếu < 1
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

  const handleCheckout = async () => {
  // Chỉ gọi API khi người dùng thanh toán
  await dispatch(changeCartItemThunk(cartItemsWithDetails));
  navigate('/order');
};

  console.log("cartItemsWithDetails", cartItemsWithDetails);
  const totalQuantity = cartItemsWithDetails.reduce((sum, item) => sum + item.quantity, 0);
  // const totalQuantity = 0;
  // const totalPrice = 0;
  const totalPrice = cartItemsWithDetails.reduce((sum, item) => sum + item.quantity * item.product.price, 0);


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
              <img src={item.product.image} alt={item.product.prod_name} />

              <span>{item.product.prod_name}</span>
            </div>
            <div>{formatCurrency(item.product.price)}</div>
            <div className="quantity-control">
              <button onClick={() => handleQuantityChange(item.product._id, -1)}>-</button>
              <span>{item.quantity}</span>
              <button onClick={() => handleQuantityChange(item.product._id, 1)}>+</button>
            </div>
            <div>{formatCurrency(item.product.price * item.quantity)}</div>
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
          <input type="text" placeholder="Nhập mã giảm giá" />
          <button>ÁP DỤNG</button>
        </div>
        <div className="summary-box">
          <p><strong>Số lượng:</strong> {totalQuantity}</p>
          <p><strong>Thành tiền:</strong> {formatCurrency(totalPrice)}</p>
          <button className="checkout-button"  onClick={() => handleCheckout()}>THANH TOÁN</button>
        </div>
      </div>

      </div>
      <Footer/>
    </>
  );
}
