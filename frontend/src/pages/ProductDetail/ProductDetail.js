import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ProductDetail.css';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer.js';
import { useGetProductsQuery } from "../../features/product/productApi.js";
import { apiAddItem } from '../../apis/cart.js';
import Swal from 'sweetalert2';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../../app/store/cartSlice.js';
import { fetchCartThunk } from '../../app/store/cartThunks.js';
import ReactMarkdown from 'react-markdown';
import { selectIsAuthenticated } from "../../app/store/authSlice";
import ReviewSection from '../../components/ReviewSection/ReviewSection';
import WishlistButton from '../../components/WishlistButton/WishlistButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';




export default function ProductDetail() {
  const [quantity, setQuantity] = useState(1);
  const [zoomStyle, setZoomStyle] = useState({ display: 'none' });
  const [lensStyle, setLensStyle] = useState({ display: 'none' });
  const imgRef = useRef(null);
  const { id } = useParams();
  const { data: products = [], isLoading: isLoadingProducts } = useGetProductsQuery();
  const product = products.find((p) => p._id === id);

  // Lấy tất cả ảnh từ model mới
  const allImages = (product?.images || []).flatMap(img => 
    Array.isArray(img.image) ? img.image : [img.image]
  );
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    if (product) {
      setMainImage(allImages[0] || '');
    }
  }, [product]);

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
    // Kiểm tra tồn kho trước khi thêm vào giỏ
    if (!product.stock || product.stock <= 0 || quantity > product.stock) {
      Swal.fire({
        icon: 'error',
        title: 'Đặt hàng thất bại',
        text: 'Một số sản phẩm không đủ số lượng trong kho',
        showConfirmButton: true,
      });
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
      Swal.fire({
        icon: 'error',
        title: 'Thêm vào giỏ thất bại',
        text: err.message || err || 'Có lỗi xảy ra, vui lòng thử lại.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    // Kiểm tra tồn kho trước khi mua ngay
    if (!product.stock || product.stock <= 0 || quantity > product.stock) {
      Swal.fire({
        icon: 'error',
        title: 'Đặt hàng thất bại',
        text: 'Một số sản phẩm không đủ số lượng trong kho',
        showConfirmButton: true,
      });
      return;
    }
    const discountedPrice = product.discount > 0
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;
    navigate('/order', {
      state: {
        buyNowItem: {
          product: {
            _id: product._id,
            prod_name: product.prod_name,
            price: discountedPrice,
          },
          quantity: quantity,
        }
      }
    });
  };
  if (isLoadingProducts) {
    return <><Header /><div className="container">Đang tải sản phẩm...</div><Footer /></>;
  }
  if (!product) {
    return <><Header /><div className="container">Không tìm thấy sản phẩm.</div><Footer /></>;
  }

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    
    const { left, top, width, height } = imgRef.current.getBoundingClientRect();
    const x = ((e.pageX - left - window.scrollX) / width) * 100;
    const y = ((e.pageY - top - window.scrollY) / height) * 100;

    // Lens position (centered on mouse)
    const lensWidth = 100; // px
    const lensHeight = 100; // px
    let lx = e.pageX - left - window.scrollX - lensWidth / 2;
    let ly = e.pageY - top - window.scrollY - lensHeight / 2;

    // Constrain lens within image bounds
    lx = Math.max(0, Math.min(lx, width - lensWidth));
    ly = Math.max(0, Math.min(ly, height - lensHeight));

    setLensStyle({
      display: 'block',
      left: `${lx}px`,
      top: `${ly}px`,
      width: `${lensWidth}px`,
      height: `${lensHeight}px`
    });

    setZoomStyle({
      display: 'block',
      backgroundPosition: `${x}% ${y}%`,
      backgroundImage: `url(${mainImage})`
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({ display: 'none' });
    setLensStyle({ display: 'none' });
  };

  return (
    <>
      <Header />
      <div className="container">
        <div className="breadcrumb">
          TRANG CHỦ {'>'} {product.category_id.category_name} {'>'} {product.prod_name}
        </div>

        <div className="product">
          <div className="product-images-section">
            <div className="image-zoom-container">
              <div 
                className={`images ${zoomStyle.display === 'block' ? 'zoomed' : ''}`}
                onMouseMove={handleMouseMove} 
                onMouseLeave={handleMouseLeave}
              >
                <img 
                  ref={imgRef}
                  src={mainImage} 
                  alt={product.prod_name} 
                />
                <div className="zoom-lens" style={lensStyle}></div>
              </div>
              <div className="zoom-overlay" style={zoomStyle}></div>
            </div>

            <div className="product-thumbnails-carousel">
              <Swiper
                modules={[Navigation]}
                spaceBetween={10}
                slidesPerView={4}
                navigation
                className="mySwiper"
              >
                {allImages.map((img, idx) => (
                  <SwiperSlide key={idx}>
                    <div 
                      className={`thumbnail-item ${mainImage === img ? 'active' : ''}`}
                      onClick={() => setMainImage(img)}
                    >
                      <img src={img} alt={`thumb-${idx}`} />
                    </div>
                  </SwiperSlide>
                ))}
              </Swiper>
            </div>
          </div>

          <div className="info">
            <div className="info-header-row">
              <h1>{product.prod_name}</h1>
              <WishlistButton productId={product._id} size="normal" />
            </div>
            {product.discount > 0 ? (
              <div className="detail-price-wrapper">
                <span className="price detail-price-discounted">
                  {Math.round(product.price * (1 - product.discount / 100)).toLocaleString('vi-VN')} ₫
                </span>
                <span className="detail-price-original">
                  {product.price.toLocaleString('vi-VN')} ₫
                </span>
                <span className="detail-discount-tag">-{Math.round(product.discount)}%</span>
              </div>
            ) : (
              <div className="price">{product.price.toLocaleString('vi-VN')} ₫</div>
            )}

            <div className="quantity">
              <label>Số lượng: </label>

              <button
                className="qty-btn"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={product.stock <= 0}
              >-</button>

              <input
                type="number"
                min="1"
                max={product.stock > 0 ? product.stock : 1}
                value={product.stock <= 0 ? 0 : quantity}
                onChange={e => {
                  const val = Number(e.target.value);
                  if (product.stock <= 0) return;
                  const maxStock = Math.max(1, product.stock);
                  const clamped = Math.min(maxStock, Math.max(1, val));
                  setQuantity(clamped);
                }}
                disabled={product.stock <= 0}
              />
              <button
                className="qty-btn"
                onClick={() => setQuantity(q => Math.min(Math.max(1, product.stock), q + 1))}
                disabled={product.stock <= 0}
              >
                +
              </button>

              <button
                className="add-to-cart-btn"
                onClick={handleAddToCart}
                disabled={loading || product.stock <= 0}
              >
                {product.stock <= 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
              </button>

              <button
                className="buy-now-btn"
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
              >
                Mua ngay
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
                <img src={prod.images?.[0]?.image?.[0] || ''} alt={prod.name} />
                <div>{prod.prod_name}</div>
                <div className="price">{prod.price.toLocaleString('vi-VN')} ₫</div>
              </div>
            ))}
        </div>
      </div>
      <Footer />
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
