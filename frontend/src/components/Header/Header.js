import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faUser, faSearch, faBars, faTimes, faCaretDown, faCaretUp, faPhone } from '@fortawesome/free-solid-svg-icons';
import "./Header.css";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSearchTerm, clearSearchTerm } from "../../features/search/searchSlice";
import { userApi } from "../../features/user/userApi.js";
import { orderApi } from "../../features/order/orderApi.js";
import { productApi, useGetProductsQuery } from "../../features/product/productApi.js";
import { categoryApi, useGetCategoriesQuery } from "../../features/services/categoryApi.js";
import { reviewApi } from "../../features/services/reviewApi.js";
import { wishlistApi } from "../../features/services/wishlistApi.js";
import { logout, selectIsAuthenticated } from "../../app/store/authSlice.js";
import { clearCart } from "../../app/store/cartSlice";
import { useGetGeneralImagesQuery } from "../../features/services/generalImageApi.js";
import logo from "../../assets/logohcshop.png";

export default function Header() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const count = useSelector(state =>
    isAuthenticated ? (state.cart?.cart?.length || 0) : 0
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { data: categories, isLoading, isError } = useGetCategoriesQuery();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: allProducts = [], isLoading: productsLoading } = useGetProductsQuery();
  const { data: logoData } = useGetGeneralImagesQuery({ search: 'Logo' });

  const dbLogo = logoData?.data?.find(img => img.image_name === 'Logo')?.image?.[0] || logo;

  const searchTerm = useSelector((state) => state.search.searchTerm);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleInputChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
    setShowDropdown(true);
  };

  const handleSelectProduct = (slug) => {
    dispatch(clearSearchTerm());
    navigate(`/product/${slug}`);
    setShowDropdown(false);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      setShowDropdown(false);
      navigate(`/products?search=${searchTerm}`);
    }
  };

  const handleLinkClick = (path) => {
    if (window.location.pathname === path) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  const handleLogoClick = (e) => {
    if (window.location.pathname === "/") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const [productDropdown, setProductDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const slugify = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, '-')
      .toLowerCase();
  };

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearCart());
    dispatch(userApi.util.resetApiState());
    dispatch(orderApi.util.resetApiState());
    dispatch(productApi.util.resetApiState());
    dispatch(categoryApi.util.resetApiState());
    dispatch(reviewApi.util.resetApiState());
    dispatch(wishlistApi.util.resetApiState());
    navigate("/");
    localStorage.removeItem("isAuthenticated");
  };

  const filteredProducts = allProducts.filter((p) =>
    p.prod_name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5);

  return (
    <header className="header">
      {/* TOP ROW: DYNAMIC BACKGROUND */}
      <div className="header-top">
        <div className="header-container">
          {/* Desktop Logo */}
          <div className="header-left desktop-only">
            <Link to="/" className="logo-link" onClick={handleLogoClick}>
              <img src={dbLogo} alt="HC Shop" className="header-logo-img" />
            </Link>
          </div>

          {/* Mobile Left: Menu & Search Icons */}
          <div className="header-mobile-controls">
            <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
              <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
            </button>
            <button className="mobile-search-btn" onClick={() => setIsSearchOpen(!isSearchOpen)}>
              <FontAwesomeIcon icon={isSearchOpen ? faTimes : faSearch} />
            </button>
          </div>

          {/* Mobile Center: Logo */}
          <div className="header-mobile-logo">
            <Link to="/" className="logo-link" onClick={handleLogoClick}>
              <img src={dbLogo} alt="HC Shop" className="header-logo-img" />
            </Link>
          </div>

          {/* Search Bar (Desktop) */}
          <div className="header-center-top desktop-only">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Tìm kiếm thương hiệu, sản phẩm, bài viết..."
                className="search-bar-input"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleEnter}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => searchTerm && setShowDropdown(true)}
              />
              <div className="search-btn" onClick={() => handleEnter({ key: "Enter" })}>
                <FontAwesomeIcon icon={faSearch} className="search-icon-svg" />
              </div>
              {showDropdown && searchTerm && (
                <div className="search-dropdown">
                  {productsLoading ? (
                    <div className="search-no-result">Đang tải sản phẩm...</div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="search-suggestion-item"
                        onClick={() => handleSelectProduct(product.product_url || product._id)}
                      >
                        <img
                          src={(() => {
                            const firstImg = product.images?.[0];
                            const imgUrl = Array.isArray(firstImg?.image) ? firstImg.image[0] : firstImg?.image;
                            return imgUrl || '';
                          })()}
                          alt={product.prod_name}
                          className="search-product-image"
                        />
                        <span className="search-product-name">{product.prod_name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="search-no-result">Không tìm thấy sản phẩm "{searchTerm}"</div>
                  )}
                </div>
              )}
            </div>
          </div>



          {/* Icons/Info Section */}
          <div className="header-right-top">
            <div className="header-info-item phone-item desktop-only">
              <FontAwesomeIcon icon={faPhone} />
              <span className="info-text">0776856666</span>
            </div>

            <div className="header-info-item user-item"
              onMouseEnter={() => setUserDropdown(true)}
              onMouseLeave={() => setUserDropdown(false)}>
              <FontAwesomeIcon icon={faUser} />
              <span className="info-text desktop-only">{isAuthenticated ? "Tài Khoản" : "Tài Khoản"}</span>
              {userDropdown && (
                <div className="dropdown-menu user-dropdown">
                  {isAuthenticated ? (
                    <>
                      <Link to="/user" className="dropdown-item">Thông tin cá nhân</Link>
                      <button onClick={handleLogout} className="dropdown-item logout-btn">Đăng xuất</button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" className="dropdown-item">Đăng nhập</Link>
                      <Link to="/register" className="dropdown-item">Đăng ký</Link>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="header-info-item header-cart-item" onClick={() => isAuthenticated ? navigate("/cart") : setShowLoginModal(true)}>
              <FontAwesomeIcon icon={faCartShopping} />
              <span className="info-text desktop-only" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Giỏ Hàng ({count})</span>
              {count > 0 && <span className="mobile-cart-badge">{count}</span>}
            </div>
          </div>
        </div>

        {/* Mobile Search Input (Expandable) */}
        {isSearchOpen && (
          <div className="mobile-search-container">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Tìm kiếm..."
                className="search-bar-input"
                value={searchTerm}
                onChange={handleInputChange}
                onKeyDown={handleEnter}
                autoFocus
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                onFocus={() => searchTerm && setShowDropdown(true)}
              />
              <div className="search-btn" onClick={() => handleEnter({ key: "Enter" })}>
                <FontAwesomeIcon icon={faSearch} className="search-icon-svg" />
              </div>
              {showDropdown && searchTerm && (
                <div className="search-dropdown">
                  {productsLoading ? (
                    <div className="search-no-result">Đang tải sản phẩm...</div>
                  ) : filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="search-suggestion-item"
                        onClick={() => {
                          handleSelectProduct(product.product_url || product._id);
                          setIsSearchOpen(false);
                        }}
                      >
                        <img
                          src={(() => {
                            const firstImg = product.images?.[0];
                            const imgUrl = Array.isArray(firstImg?.image) ? firstImg.image[0] : firstImg?.image;
                            return imgUrl || '';
                          })()}
                          alt={product.prod_name}
                          className="search-product-image"
                        />
                        <span className="search-product-name">{product.prod_name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="search-no-result">Không tìm thấy sản phẩm "{searchTerm}"</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>


      {/* BOTTOM ROW: BLACK BACKGROUND */}
      <div className={`header-bottom ${isMobileMenuOpen ? 'mobile-active' : ''}`}>
        <div className="header-container">
          <nav className="nav-links">
            <Link to="/" className="nav-link" onClick={() => handleLinkClick("/")}>TRANG CHỦ</Link>

            <div className="nav-dropdown"
              onMouseEnter={() => setProductDropdown(true)}
              onMouseLeave={() => setProductDropdown(false)}>
              <span className="nav-link dropdown-toggle" onClick={() => {
                handleLinkClick("/products");
                navigate("/products");
              }}>
                SẢN PHẨM <FontAwesomeIcon icon={productDropdown ? faCaretUp : faCaretDown} />
              </span>
              {productDropdown && (
                <div className="dropdown-menu">
                  {isLoading && <p className="dropdown-item">Đang tải...</p>}
                  {!isLoading && !isError && categories?.map((cat) => (
                    <Link
                      key={cat._id}
                      to={`/products/${encodeURIComponent(slugify(cat.category_name))}`}
                      className="dropdown-item"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {cat.category_name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* <Link to="/khuyen-mai" className="nav-link">KHUYẾN MÃI</Link> */}
            {/* <Link to="/thuong-hieu" className="nav-link">THƯƠNG HIỆU</Link>
            <Link to="/hop-tac" className="nav-link">HỢP TÁC KINH DOANH</Link> */}
            <Link to="/huong-dan" className="nav-link" onClick={() => handleLinkClick("/huong-dan")}>HƯỚNG DẪN / REVIEW</Link>
            {/* <Link to="/dich-vu" className="nav-link">DỊCH VỤ</Link> */}
            <Link to="/contact" className="nav-link" onClick={() => handleLinkClick("/contact")}>VỀ CHÚNG TÔI</Link>
          </nav>
        </div>
      </div>

      {showLoginModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Bạn chưa đăng nhập</h3>
            <p>Hãy đăng nhập để xem giỏ hàng.</p>
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
    </header>
  );
}
