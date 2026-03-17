import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer.js';
import { useGetProductsQuery } from "../../features/product/productApi.js";
import { apiAddItem } from '../../apis/cart.js';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import {addToCart } from '../../app/store/cartSlice.js';
import { fetchCartThunk } from '../../app/store/cartThunks.js';
import ReactMarkdown from 'react-markdown';
import { selectIsAuthenticated } from "../../app/store/authSlice";
import ReviewSection from '../../components/ReviewSection/ReviewSection';
import WishlistButton from '../../components/WishlistButton/WishlistButton';




export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const { id } = useParams();
  const {data: products = [], isLoading: isLoadingProducts} = useGetProductsQuery();
  const product = products.find((p) => p._id === id);
  const navigate = useNavigate();
  const [loading,setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const status = useSelector(state => state.cart.status);
  const dispatch = useDispatch();
  const hasHandled = useRef(false);

  useEffect(() => {
    if (hasHandled.current) return;
    hasHandled.current = true;
    setQuantity(1);
  }, [id]);

  const isAuthenticated = useSelector(selectIsAuthenticated);

  const handleAddToCart = async (e) => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    setLoading(true);
    try {
      await dispatch(addToCart({ product_id: product._id, quantity }))
      .unwrap()
      .then((res) => {
        Swal.fire({
          icon: 'success',
          title: 'Thêm vào giỏ hàng thành công!',
          showConfirmButton: false,
          timer: 1000
        });
      })
      dispatch(fetchCartThunk());
    } catch (err) {
      console.error('Lỗi khi thêm vào giỏ:', err);
      setError('Thêm vào giỏ thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };
  if (isLoadingProducts) {
    return <><Header/><div className="container">Đang tải sản phẩm...</div><Footer/></>;
  }
  if (!product) {
    return <><Header/><div className="container">Không tìm thấy sản phẩm.</div><Footer/></>;
  }

  return (
    <>
      <Header/>
      <div className="container">
        <div className="breadcrumb">
          TRANG CHỦ {'>'} {product.category_id.category_name} {'>'} {product.prod_name}
        </div>

        <div className="product">
          <div className="images">
            <img src={product.images?.find(img => img?.is_primary_image)?.image || ''} alt={product.prod_name} />
          </div>

          <div className="info">
            <div className="info-header-row">
              <h1>{product.prod_name}</h1>
              <WishlistButton productId={product._id} size="normal" />
            </div>
            <div className="price">{product.price.toLocaleString('vi-VN')} ₫</div>

            <div className="quantity">
              <label>Số lượng: </label>
              
              <button 
              className="qty-btn"
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              >-</button>

              <input 
              type="number" 
              min="1" 
              max= {product.stock}
              value={quantity} 
              onChange={e => {
                const val = Number(e.target.value);
                const clamped = Math.min(product.stock, Math.max(1, val));
                setQuantity(clamped);
              }}

              />
              <button 
              className="qty-btn"
              onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
              >
              +
              </button>
              
              <button 
              className="add-to-cart-btn"
              onClick={handleAddToCart}
              disabled={loading}
              >
              Thêm vào giỏ
              </button>

            </div>
            <p>Số lượng trong kho: {product.stock}</p>
            <p>Thương hiệu: {product.brand_id.brand_name || ''}</p>
            <p>Danh mục: {product.category_id.category_name || ''}</p>
          </div>
        </div>

        <div className="section-heading">THÔNG TIN CHI TIẾT</div>
          <div className="details">
            <ReactMarkdown>{product.description}</ReactMarkdown>
          </div>

        {/* Review Section */}
        <ReviewSection productId={product._id} />

        <div className="home-section-title">Sản phẩm tương tự</div>
        <div className="similar-products">
          {products
            .filter((p) => p.category_id.category_name === product.category_id.category_name && p._id !== product._id)
            .slice(0, 4)
            .map((prod, i) => (
              <div key={i} className="product-item" onClick={() => navigate(`/product/${prod.id}`)}>
                <img src={prod.images?.find(img => img?.is_primary_image)?.image || ''} alt={prod.name} />
                <div>{prod.prod_name}</div>
                <div className="price">{prod.price.toLocaleString('vi-VN')} ₫</div>
              </div>
            ))}
        </div>
      </div>
      <Footer/>
      {showLoginModal && (
          <div className="modal-backdrop">
          <div className="modal">
            <h3>Bạn chưa đăng nhập</h3>
            <p>Hãy đăng nhập để thêm sản phẩm vào giỏ hàng.</p>
            <div className="modal-buttons">
              <button 
                onClick={() => {
                  setShowLoginModal(false);
                  navigate("/login");
                }}
                className="modal-button-login"
              >Đăng nhập</button>
              <button className="modal-button-cancel" onClick={() => setShowLoginModal(false)}>Hủy</button>
            </div>
          </div>
        </div>
        )}
    </>
  );
};
