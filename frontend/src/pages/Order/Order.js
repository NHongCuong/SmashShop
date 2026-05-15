import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

import { useState, useMemo, useEffect } from "react";
import "./Order.css";
import { useDispatch, useSelector } from "react-redux";
import { createOrderThunk } from "../../app/store/orderThunk";
import { removeCartItemThunk } from "../../app/store/cartThunks";
import Swal from "sweetalert2";
import { useNavigate, useLocation } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const EMPTY_CART = [];

const getDiscountedPrice = (product) => {
  if (product.discount > 0) {
    return Math.round(product.price * (1 - product.discount / 100));
  }
  return product.price;
};

const compareVariants = (v1, v2) => {
  if (!v1 && !v2) return true;
  if (!v1 || !v2) return false;
  const k1 = Object.keys(v1);
  const k2 = Object.keys(v2);
  if (k1.length !== k2.length) return false;
  return k1.every(k => v1[k] === v2[k]);
};

export default function Order() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const cartItems = useSelector((state) => state.cart?.cart || EMPTY_CART);

  // Check if this is a "Buy Now" flow or coming from Cart with voucher
  const buyNowItem = location.state?.buyNowItem || null;
  const stateCartItems = location.state?.cartItems || null;
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

  const [localOrderItems, setLocalOrderItems] = useState([]);

  useEffect(() => {
    setLocalOrderItems(orderItems);
  }, [orderItems]);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    street: '',
    note: '',
    gender: 'Nam',
    deliveryType: 'Giao tận nơi',
  });

  const [isOtherReceiver, setIsOtherReceiver] = useState(false);
  const [otherReceiverData, setOtherReceiverData] = useState({
    title: 'Anh',
    name: '',
    phone: ''
  });

  const handleChangeOtherReceiver = e => {
    setOtherReceiverData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const [paymentMethod, setPaymentMethod] = useState('cod');

  // Address dropdowns (using esgoo.net for 2026 data)
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [wards, setWards] = useState([]);

  const [selectedProvince, setSelectedProvince] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [selectedWard, setSelectedWard] = useState('');

  useEffect(() => {
    fetch('https://esgoo.net/api-tinhthanh/1/0.htm')
      .then(res => res.json())
      .then(res => {
        if (res.error === 0) setProvinces(res.data);
      })
      .catch(err => console.error("Error fetching provinces:", err));
  }, []);

  const handleProvinceChange = (e) => {
    const code = e.target.value;
    setSelectedProvince(code);
    setSelectedDistrict('');
    setSelectedWard('');
    setDistricts([]);
    setWards([]);

    if (code) {
      fetch(`https://esgoo.net/api-tinhthanh/2/${code}.htm`)
        .then(res => res.json())
        .then(res => {
          if (res.error === 0) setDistricts(res.data);
        })
        .catch(err => console.error(err));
    }
  };

  const handleDistrictChange = (e) => {
    const code = e.target.value;
    setSelectedDistrict(code);
    setSelectedWard('');
    setWards([]);

    if (code) {
      fetch(`https://esgoo.net/api-tinhthanh/3/${code}.htm`)
        .then(res => res.json())
        .then(res => {
          if (res.error === 0) setWards(res.data);
        })
        .catch(err => console.error(err));
    }
  };

  const handleChange = e => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuantityChange = (productId, changeAmount, variants) => {
    const item = localOrderItems.find(i => i.product._id === productId && compareVariants(i.selected_variants || i.variants, variants));
    if (!item) return;

    const newQuantity = item.quantity + changeAmount;
    const stock = item.product.stock;

    if (changeAmount > 0 && stock !== undefined && newQuantity > stock) {
      return;
    }

    if (newQuantity < 1) {
      handleRemove(productId, variants);
    } else {
      setLocalOrderItems(prevItems => {
        return prevItems.map(i => {
          if (i.product._id === productId && compareVariants(i.selected_variants || i.variants, variants)) {
            return { ...i, quantity: newQuantity };
          }
          return i;
        });
      });
    }
  };

  const handleRemove = (productId, variants) => {
    Swal.fire({
      title: 'Xác nhận xóa?',
      text: "Bạn có chắc chắn muốn xóa sản phẩm này khỏi đơn hàng?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#e44d26',
      cancelButtonColor: '#999',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    }).then((result) => {
      if (result.isConfirmed) {
        // Xóa khỏi local state của trang Order
        setLocalOrderItems(prev => prev.filter(item => !(item.product._id === productId && compareVariants(item.selected_variants || item.variants, variants))));
        
        // Xóa khỏi giỏ hàng Redux (nếu có)
        dispatch(removeCartItemThunk({
          product_id: productId,
          variants: variants
        }));

        Swal.fire({
          title: 'Đã xóa!',
          text: 'Sản phẩm đã được xóa.',
          icon: 'success',
          timer: 1500,
          showConfirmButton: false
        });
      }
    });
  };

  const total = localOrderItems.reduce((sum, i) => sum + getDiscountedPrice(i.product) * i.quantity, 0);

  const discount = appliedVoucher
    ? localOrderItems.reduce((sum, item) => {
      const productVoucherId = item.product.voucher_id?._id || item.product.voucher_id;
      if (productVoucherId === appliedVoucher._id) {
        return sum + (item.quantity * getDiscountedPrice(item.product) * appliedVoucher.discount_percent) / 100;
      }
      return sum;
    }, 0)
    : 0;

  const finalTotal = total - discount;

  const handleSubmit = async () => {
    const requiredShippingFields = ['name', 'street', 'phone', 'email'];
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

    if (!selectedProvince || !selectedDistrict || !selectedWard) {
      Swal.fire({
        icon: 'error',
        title: `Vui lòng chọn đầy đủ địa chỉ giao hàng`,
        showConfirmButton: false,
        timer: 1000
      });
      return;
    }

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
        text: 'Vui lòng nhập đúng định dạng email.',
        timer: 2000
      });
      return;
    }

    if (isOtherReceiver) {
      if (!otherReceiverData.name || !otherReceiverData.phone) {
        Swal.fire({
          icon: 'error',
          title: `Vui lòng nhập thông tin người nhận khác`,
          showConfirmButton: false,
          timer: 1000
        });
        return;
      }
      if (!phoneRegex.test(otherReceiverData.phone)) {
        Swal.fire({
          icon: 'error',
          title: 'Số điện thoại người nhận không hợp lệ',
          text: 'Số điện thoại phải bao gồm đúng 10 chữ số.',
          timer: 2000
        });
        return;
      }
    }

    if (localOrderItems.length === 0) {
      Swal.fire({
        icon: 'error',
        title: "Không có sản phẩm nào để đặt hàng.",
        showConfirmButton: false,
        timer: 1000
      });
      return;
    }

    const provinceName = provinces.find(p => p.id === selectedProvince)?.full_name || '';
    const districtName = districts.find(d => d.id === selectedDistrict)?.full_name || '';
    const wardName = wards.find(w => w.id === selectedWard)?.full_name || '';

    const fullAddress = `${formData.street}, ${wardName}, ${districtName}, ${provinceName}`;

    const shipping = {
      name: formData.name,
      address: fullAddress,
      phone: formData.phone,
      email: formData.email,
      note: formData.note,
      deliveryType: formData.deliveryType,
      gender: formData.gender,
      otherReceiver: isOtherReceiver ? otherReceiverData : null
    };

    const items = localOrderItems.map(i => ({
      product: i.product._id,
      quantity: i.quantity,
      variants: i.selected_variants || i.variants
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
        const result = await dispatch(createOrderThunk(orderData)).unwrap();
        Swal.fire({
          icon: 'success',
          title: "Đơn hàng của bạn đã được đặt thành công.",
          showConfirmButton: false,
          timer: 1000
        });
        navigate('/order-success', { state: { order: result } });
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
        const orderResult = await dispatch(createOrderThunk(orderData)).unwrap();
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
    <div className="order-page-wrapper">
      <Header />

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '15px 0' }}>
        <p style={{ color: '#666', fontSize: '13px', margin: 0 }}>Trang chủ {'>'} {buyNowItem ? 'Mua ngay' : 'Giỏ hàng'}</p>
      </div>

      <div className="order-container new-layout">
        {/* LEFT COLUMN */}
        <div className="order-form-left">

          {/* THÔNG TIN KHÁCH HÀNG */}
          <div className="form-section">
            <div className="section-title">
              <span>Thông tin khách hàng</span>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Họ và Tên</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className="form-group half">
                <label>Giới tính</label>
                <div className="radio-group" style={{ marginBottom: 0, marginTop: '8px' }}>
                  <label>
                    <input
                      type="radio" name="gender" value="Nam"
                      checked={formData.gender === 'Nam'} onChange={handleChange}
                    /> Nam
                  </label>
                  <label>
                    <input
                      type="radio" name="gender" value="Nữ"
                      checked={formData.gender === 'Nữ'} onChange={handleChange}
                    /> Nữ
                  </label>
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half">
                <label>Số điện thoại</label>
                <input type="tel" name="phone" value={formData.phone} onChange={handleChange} />
              </div>
              <div className="form-group half">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
            </div>
          </div>

          {/* THÔNG TIN GIAO HÀNG */}
          <div className="form-section">
            <div className="section-title">Thông tin giao hàng</div>

            <div className="radio-group" style={{ marginBottom: '15px' }}>
              <label>
                <input
                  type="radio" name="deliveryType" value="Giao tận nơi"
                  checked={formData.deliveryType === 'Giao tận nơi'} onChange={handleChange}
                /> Giao tận nơi
              </label>
              <label>
                <input
                  type="radio" name="deliveryType" value="Nhận tại cửa hàng"
                  checked={formData.deliveryType === 'Nhận tại cửa hàng'} onChange={handleChange}
                /> Nhận tại cửa hàng
              </label>
            </div>

            <div className="form-row">
              <div className="form-group third">
                <label>Tỉnh/Thành phố</label>
                <select value={selectedProvince} onChange={handleProvinceChange}>
                  <option value="">-- Chọn Tỉnh/Thành phố --</option>
                  {provinces.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group third">
                <label>Quận/Huyện</label>
                <select value={selectedDistrict} onChange={handleDistrictChange} disabled={!selectedProvince}>
                  <option value="">-- Chọn Quận/Huyện --</option>
                  {districts.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group third">
                <label>Phường/Xã</label>
                <select value={selectedWard} onChange={(e) => setSelectedWard(e.target.value)} disabled={!selectedDistrict}>
                  <option value="">-- Chọn Phường/Xã --</option>
                  {wards.map(w => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Địa chỉ cụ thể</label>
              <input
                type="text" name="street"
                placeholder="Số nhà, tên đường..."
                value={formData.street} onChange={handleChange}
              />
            </div>

            <div className="form-group" style={{ marginTop: '5px' }}>
              <label>Yêu cầu khác (không bắt buộc)</label>
              <input
                type="text" name="note"
                value={formData.note} onChange={handleChange}
              />
            </div>

            <div className="checkbox-group">
              <div>
                <label>
                  <input type="checkbox" checked={isOtherReceiver} onChange={e => setIsOtherReceiver(e.target.checked)} /> Người nhận khác (nếu có)
                </label>
                {isOtherReceiver && (
                  <div className="other-receiver-info">
                    <div className="radio-group" style={{ marginBottom: '8px' }}>
                      <label>
                        <input type="radio" name="title" value="Anh" checked={otherReceiverData.title === 'Anh'} onChange={handleChangeOtherReceiver} /> Anh
                      </label>
                      <label>
                        <input type="radio" name="title" value="Chị" checked={otherReceiverData.title === 'Chị'} onChange={handleChangeOtherReceiver} /> Chị
                      </label>
                    </div>
                    <div className="form-row">
                      <div className="form-group half">
                        <label>Họ và Tên</label>
                        <input type="text" name="name" value={otherReceiverData.name} onChange={handleChangeOtherReceiver} />
                      </div>
                      <div className="form-group half">
                        <label>Số điện thoại người nhận</label>
                        <input type="tel" name="phone" value={otherReceiverData.phone} onChange={handleChangeOtherReceiver} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <label><input type="checkbox" /> Hướng dẫn sử dụng, giải đáp thắc mắc sản phẩm</label>
            </div>
          </div>

          {/* PHƯƠNG THỨC GIAO HÀNG */}
          <div className="form-section">
            <div className="section-title">Phương thức giao hàng</div>
            <p className="delivery-note">Nhân viên sẽ gọi lại và xác nhận phí ship giao hàng với bạn!</p>
          </div>

          {/* PHƯƠNG THỨC THANH TOÁN */}
          <div className="form-section">
            <div className="section-title">Phương thức thanh toán</div>
            <div className="radio-group vertical">
              <label>
                <input
                  type="radio" name="paymentMethod" value="cod"
                  checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')}
                /> Thanh toán khi nhận hàng
              </label>
              <label>
                <input
                  type="radio" name="paymentMethod" value="vnpay"
                  checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')}
                /> Thanh toán qua VNPAY
              </label>
            </div>
            <div className="policy-checkbox" style={{ marginTop: '15px' }}>
              <label>
                <input type="checkbox" defaultChecked /> Tôi đồng ý với <a href="#">Chính Sách Bảo Mật Thông Tin Khách Hàng</a> của SmashShop
              </label>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN */}
        <div className="order-summary-right">
          <div className="summary-products">
            {localOrderItems.map((item, index) => {
              // Lấy ảnh từ field 'images' (mảng object) hoặc 'image' (mảng string)
              const allImages = (item.product.images || []).flatMap(img =>
                Array.isArray(img.image) ? img.image : [img.image]
              );
              const cartImage = Array.isArray(item.product.image) ? item.product.image[0] : item.product.image;
              const firstImage = allImages[0] || cartImage || 'https://via.placeholder.com/60';

              return (
                <div key={item.product._id + index} className="summary-item">
                  <img
                    src={firstImage}
                    alt={item.product.prod_name}
                    className="summary-item-img"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60'; }}
                  />
                  <div className="summary-item-info">
                    <div className="summary-item-name">
                      <span>{item.product.prod_name} <FontAwesomeIcon icon={faGift} className="gift-icon" /></span>
                      <FontAwesomeIcon icon={faTimesCircle} className="remove-icon" onClick={() => handleRemove(item.product._id, item.selected_variants || item.variants)} />
                    </div>

                    <div className="summary-item-variant">
                      {item.selected_variants && Object.entries(item.selected_variants).map(([name, value]) => (
                        <span key={name} style={{ marginRight: '10px' }}>{name}: {value}</span>
                      ))}
                      {(item.variants && !item.selected_variants) && Object.entries(item.variants).map(([name, value]) => (
                        <span key={name} style={{ marginRight: '10px' }}>{name}: {value}</span>
                      ))}
                    </div>

                    {item.product.discount > 0 && (
                      <div className="summary-item-promo">
                        Đang áp dụng: {item.product.prod_name} -{item.product.discount}%
                      </div>
                    )}

                    <div className="summary-item-actions">
                      <div className="quantity-control-order">
                        <button className="quantity-btn" onClick={() => handleQuantityChange(item.product._id, -1, item.selected_variants || item.variants)}>-</button>
                        <input type="text" className="quantity-input" value={item.quantity} readOnly />
                        <button className="quantity-btn" onClick={() => handleQuantityChange(item.product._id, 1, item.selected_variants || item.variants)} disabled={item.product.stock !== undefined && item.quantity >= item.product.stock}>+</button>
                      </div>
                      <div className="summary-item-price">
                        <div className="price-current">{(getDiscountedPrice(item.product)).toLocaleString()}đ</div>
                        {item.product.discount > 0 && (
                          <div className="price-old">{(item.product.price).toLocaleString()}đ</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="summary-calculations">
            <div className="calc-row">
              <span>Tạm tính ({localOrderItems.reduce((acc, item) => acc + item.quantity, 0)} sản phẩm):</span>
              <span>{total.toLocaleString()}đ</span>
            </div>
            <div className="calc-row">
              <span>Khuyến mãi:</span>
              <span>{discount > 0 ? `-${discount.toLocaleString()}đ` : '0đ'}</span>
            </div>
            <div className="calc-row">
              <span>Vận chuyển:</span>
              <span>0đ</span>
            </div>
            <div className="calc-total">
              <span>Tổng tiền:</span>
              <span className="total-green">{finalTotal.toLocaleString()}đ</span>
            </div>
          </div>

          <button className="order-submit-btn" onClick={handleSubmit}>
            {paymentMethod === 'cod' ? 'ĐẶT HÀNG' : 'THANH TOÁN ONLINE'}
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
