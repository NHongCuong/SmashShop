import React from "react";
import "./Footer.css";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        <div className="footer-top">
          <div className="footer-logo-section">
            <img src="https://res.cloudinary.com/djnh1cl8y/image/upload/v1778648711/IE213/yjjbxcpijqnkohnlsnns.png" alt="SmashShop Logo" className="footer-logo" />
            <div className="footer-domain">HCSHOP.COM</div>
          </div>
        </div>

        <div className="footer-links-section">
          <div className="footer-column">
            <h3 className="footer-heading">CHÍNH SÁCH MUA HÀNG</h3>
            <ul className="footer-list">
              <li><Link to="/">Chính Sách Bảo Mật</Link></li>
              <li><Link to="/">Chính Sách Giao Hàng</Link></li>
              <li><Link to="/">Chính Sách Thanh Toán</Link></li>
              <li><Link to="/">Chính Sách Bán Hàng</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">THÔNG TIN HCSHOP</h3>
            <ul className="footer-list">
              <li><Link to="/contact">Về chúng tôi</Link></li>
              <li><Link to="/info">Thông tin cần biết</Link></li>
              <li><Link to="/faq">Câu hỏi thường gặp</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">CỘNG ĐỒNG HCSHOP</h3>
            <div className="footer-social-grid">
              <Link to="/">Facebook</Link>
              <Link to="/">Youtube</Link>
              <Link to="/">Tiktok</Link>
              <Link to="/">Instagram</Link>
              <Link to="/">Zalo</Link>
              <Link to="/">Pinterest</Link>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">THÔNG TIN LIÊN HỆ</h3>
            <ul className="footer-list">
              <li><Link to="/contact">Liên hệ HCShop</Link></li>
              <li><span className="footer-highlight">Hotline CSKH: 077.685.6666</span></li>
              <li><span className="footer-highlight">Email: cskh@hcshop.com</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-images-section">
          <div className="footer-image-column">
            <h3 className="footer-heading">DANH SÁCH NGÂN HÀNG</h3>
            <img src="https://res.cloudinary.com/djnh1cl8y/image/upload/v1778651116/IE213/jsmfl2stomhgq4piwjkc.png" alt="Danh sách ngân hàng" />
          </div>
          <div className="footer-image-column">
            <h3 className="footer-heading">PHƯƠNG THỨC THANH TOÁN</h3>
            <img src="https://res.cloudinary.com/djnh1cl8y/image/upload/v1778651116/IE213/emm3u36oiapm08p86rhj.png" alt="Phương thức thanh toán" />
          </div>
          <div className="footer-image-column">
            <h3 className="footer-heading">TRẢ GÓP</h3>
            <img src="https://res.cloudinary.com/djnh1cl8y/image/upload/v1778651116/IE213/bolmda5q9vvykuldn1jn.png" alt="Trả góp" />
          </div>
          <div className="footer-image-column">
            <h3 className="footer-heading">ĐƠN VỊ VẬN CHUYỂN</h3>
            <img src="https://res.cloudinary.com/djnh1cl8y/image/upload/v1778651116/IE213/xto4t7kk2iu7brtqhdeq.png" alt="Đơn vị vận chuyển" />
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-bottom-info">
            <img src="https://res.cloudinary.com/djnh1cl8y/image/upload/v1778653662/IE213/oycyml6rjkfmj6e4yqof.png" alt="Bộ Công Thương" className="bct-logo" />
            <div className="footer-company-info">
              <h4>HỆ THỐNG CỬA HÀNG HCSHOP</h4>
              <p>Giấy chứng nhận đăng ký kinh doanh 41Y8003247</p>
              <p>do Cục Cảnh sát ĐKQL cư trú và DLQG về dân cư. Cấp ngày 11/08/2017</p>
            </div>
          </div>
          <div className="footer-copyright">
            <p>Copyright © 2019 Bản quyền website thuộc về HCShop. <span className="dmca-badge">PROTECTED DMCA</span></p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
