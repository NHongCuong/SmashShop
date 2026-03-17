import { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCartShopping, faUser, faSearch, faBars, faTimes, faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import "./Header.css"; 
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setSearchTerm, clearSearchTerm } from "../../features/search/searchSlice";
import { useGetProductsQuery } from "../../features/product/productApi";
import { useGetCategoriesQuery } from "../../features/services/categoryApi.js";
import { logout, selectIsAuthenticated } from "../../app/store/authSlice.js";
import { clearCart } from "../../app/store/cartSlice"; // ✅ thêm dòng này


export default function Header() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const count = useSelector(state => 
    isAuthenticated ? (state.cart?.cart?.length || 0) : 0
  );
  const [showLoginModal, setShowLoginModal] = useState(false);
 // lấy số lượng sản phẩm trong giỏ hàng từ Redux store
  // const count = 0 // lấy số lượng sản phẩm trong giỏ hàng từ Redux store
  // console.log(count, "statr");
  const { data: categories, isLoading, isError } = useGetCategoriesQuery();
  // SEARCH BAR
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { data: allProducts = [] } = useGetProductsQuery(); // lấy tất cả sản phẩm
  const searchTerm = useSelector((state) => state.search.searchTerm);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleInputChange = (e) => {
    dispatch(setSearchTerm(e.target.value));
    setShowDropdown(true);
  };

  const handleSelectProduct = (productId) => {
    dispatch(clearSearchTerm());
    navigate(`/product/${productId}`);
    setShowDropdown(false);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      setShowDropdown(false);
      navigate(`/products?search=${searchTerm}`);
    }
  };

   // Lọc sản phẩm theo tên
  const filteredProducts = allProducts.filter((p) =>
    p.prod_name.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 5); // giới hạn 5 kết quả

  const [productDropdown, setProductDropdown] = useState(false);
  const [userDropdown, setUserDropdown] = useState(false);
  // Hàm chuyển tiếng Việt có dấu sang không dấu và format URL-friendly
  const slugify = (str) => {
    return str
      .normalize('NFD')                   // tách dấu khỏi ký tự gốc
      .replace(/[\u0300-\u036f]/g, '')    // xóa các dấu
      .replace(/đ/g, 'd')                 // đ -> d
      .replace(/Đ/g, 'D')
      .replace(/\s+/g, '-')               // space -> dấu gạch ngang
      .toLowerCase();
  };

  // LOGOUT
  const handleLogout = () => {
    // console.log("Logout")
    // Xóa token và thông tin người dùng khỏi localStorage
    dispatch(logout());
    dispatch(clearCart());
    navigate("/");
    localStorage.removeItem("isAuthenticated"); // Xóa dữ liệu đăng nhập
  };
  // MOBILE MENU CONTROLLER
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };
  
  return (
    <header className="header" >
      {/* Logo + Menu Button */}
      <div className="header-left">
        <Link to="/" className="logo">Smash Shop</Link>
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          <FontAwesomeIcon icon={isMobileMenuOpen ? faTimes : faBars} />
        </button>
      </div>

      {/* Navigation + SearchBar */}
      <div className={`header-center ${isMobileMenuOpen ? 'active' : ''}`}>
        {/* Các link Nav */}
        <Link to="/" className="nav-link">TRANG CHỦ</Link>

        <div 
          className="nav-dropdown"
          onMouseEnter={() => setProductDropdown(true)}
          onMouseLeave={() => setProductDropdown(false)}
        >
          <button className="dropdown-btn nav-link">
            {/* Phần chữ: Bấm vào để navigate */}
            <span 
              onClick={() => navigate("/products")}
            >
              SẢN PHẨM
            </span>

            {/* Icon: Bấm vào để toggle dropdown */}
            <FontAwesomeIcon 
              icon={productDropdown ? faCaretUp : faCaretDown} 
              onClick={(e) => {
                e.stopPropagation(); // chặn sự kiện lan ra button
                setProductDropdown(prev => !prev); // toggle mở/đóng
              }} 
              
            />
          </button>
          
          {productDropdown && (
              <div className="dropdown-menu">
                {isLoading && <p className="dropdown-item">Đang tải...</p>}
                {isError && <p className="dropdown-item">Lỗi khi tải danh mục</p>}
                {!isLoading && !isError && categories?.map((cat) => (
                  <Link
                    key={cat._id}
                    to={`/products/${encodeURIComponent(slugify(cat.category_name))}`}
                    className="dropdown-item"
                  >
                    {cat.category_name}
                  </Link>
                ))}
              </div>
            )}
        </div>
      
      {/* Search Bar */}
      <div className="search-bar">
        <input 
          type="text" 
          placeholder="Bạn đang tìm gì?" 
          className="search-bar-input" 
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleEnter}
          onBlur={() => setTimeout(() => setShowDropdown(false), 200)} // delay để click chọn không bị mất dropdown
          onFocus={() => searchTerm && setShowDropdown(true)}
        />
        <FontAwesomeIcon icon={faSearch} className="search-icon"  onClick={() => handleEnter({ key: "Enter" })}/>
        {showDropdown && searchTerm && (
          <div className="search-dropdown">
            {filteredProducts.map((product) => (
              <div
                key={product._id}
                className="dropdown-item"
                onClick={() => handleSelectProduct(product._id)}
              >
                <img
                  src={product.images?.find((img) => img?.is_primary_image)?.image || ''}
                  alt={product.prod_name}
                  className="search-product-image"
                />
                <span className="search-product-name">{product.prod_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      </div>


      {/* Icons */}
      <div className="header-icons">
      <button 
        className="cart-link" 
        onClick={() => {
          if (isAuthenticated) {
            navigate("/cart");
          } else {
            setShowLoginModal(true);
          }
        }}
      >
        <FontAwesomeIcon icon={faCartShopping} className="icon" />
        {count > 0 && <span className="cart-badge">{count}</span>}
      </button>

        {/* User Menu */}
        <div
          className="user-menu"
          onMouseEnter={() => setUserDropdown(true)}
          onMouseLeave={() => setUserDropdown(false)}
          onClick={() => setUserDropdown(prev => !prev)}
        >
          <FontAwesomeIcon icon={faUser} className="icon" />
          {userDropdown && (
          <div className="dropdown-menu user-dropdown user-dropdown-left">
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
