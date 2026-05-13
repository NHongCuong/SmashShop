import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";
import { useGetGeneralImagesQuery } from "../../features/services/generalImageApi.js";

const Footer = () => {
  const { data: generalImagesData } = useGetGeneralImagesQuery();

  const getImageUrl = (name) => {
    const img = generalImagesData?.data?.find(
      (item) => item.image_name.toLowerCase() === name.toLowerCase()
    );
    const imgUrl = Array.isArray(img?.image) ? img.image[0] : img?.image;
    return imgUrl || "";
  };

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-logo-section">
            <img src={getImageUrl("Logo")} alt="HC Shop Logo" className="footer-logo" />
            <div className="footer-domain">HCSHOP.COM</div>
          </div>
        </div>

        <div className="footer-links-section">
          <div className="footer-column">
            <h3 className="footer-heading">CHÍNH SÁCH MUA HÀNG</h3>
            <ul className="footer-list">
              <li><Link to="/" onClick={handleScrollToTop}>Chính Sách Bảo Mật</Link></li>
              <li><Link to="/" onClick={handleScrollToTop}>Chính Sách Giao Hàng</Link></li>
              <li><Link to="/" onClick={handleScrollToTop}>Chính Sách Thanh Toán</Link></li>
              <li><Link to="/" onClick={handleScrollToTop}>Chính Sách Bán Hàng</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">THÔNG TIN HCSHOP</h3>
            <ul className="footer-list">
              <li><Link to="/contact" onClick={handleScrollToTop}>Về chúng tôi</Link></li>
              <li><Link to="/info" onClick={handleScrollToTop}>Thông tin cần biết</Link></li>
              <li><Link to="/faq" onClick={handleScrollToTop}>Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">CỘNG ĐỒNG HCSHOP</h3>
            <div className="footer-social-grid">
              <Link to="/" onClick={handleScrollToTop}>Facebook</Link>
              <Link to="/" onClick={handleScrollToTop}>Youtube</Link>
              <Link to="/" onClick={handleScrollToTop}>Tiktok</Link>
              <Link to="/" onClick={handleScrollToTop}>Instagram</Link>
              <Link to="/" onClick={handleScrollToTop}>Zalo</Link>
              <Link to="/" onClick={handleScrollToTop}>Pinterest</Link>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">THÔNG TIN LIÊN HỆ</h3>
            <ul className="footer-list">
              <li><Link to="/contact" onClick={handleScrollToTop}>Liên hệ HCShop</Link></li>
              <li><span className="footer-highlight">Hotline CSKH: 077.685.6666</span></li>
              <li><span className="footer-highlight">Email: cskh@hcshop.com</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-images-section">
          <div className="footer-image-column">
            <h3 className="footer-heading">DANH SÁCH NGÂN HÀNG</h3>
            <img src={getImageUrl("Bank")} alt="Danh sách ngân hàng" />
          </div>
          <div className="footer-image-column">
            <h3 className="footer-heading">PHƯƠNG THỨC THANH TOÁN</h3>
            <img src={getImageUrl("Payment")} alt="Phương thức thanh toán" />
          </div>
          <div className="footer-image-column">
            <h3 className="footer-heading">TRẢ GÓP</h3>
            <img src={getImageUrl("Installment")} alt="Trả góp" />
          </div>
          <div className="footer-image-column">
            <h3 className="footer-heading">ĐƠN VỊ VẬN CHUYỂN</h3>
            <img src={getImageUrl("Shipping Unit")} alt="Đơn vị vận chuyển" />
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-info">
            <img src={getImageUrl("Certificated")} alt="Bộ Công Thương" />
            <div className="footer-company-info">
              <h4>HỆ THỐNG CỬA HÀNG HCSHOP</h4>
              <p>Giấy chứng nhận đăng ký kinh doanh 41Y8003247</p>
              <p>do Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư. Cấp ngày 11/08/2017</p>
            </div>
          </div>
          <div className="footer-copyright">
            <p>Copyright © 2026 Bản quyền website thuộc về HCShop. <span className="dmca-badge">PROTECTED DMCA</span></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
