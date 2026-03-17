import React from "react";
import "./Footer.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faYoutube, faInstagram } from '@fortawesome/free-brands-svg-icons';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-section">
        <h2>SMASH SHOP</h2>
        <p>Địa chỉ: 4 einstein Bình Thọ,<br />Thủ Đức Bình Dương</p>
        <p>Phone: 0557-843-408</p>
        <p>Email: Smahshop@gmail.com</p>
      </div>

      <div className="footer-section">
        <h3>Giới thiệu</h3>
        <ul>
          <li><a href="#">Thông tin về chúng tôi</a></li>
        </ul>
      </div>

      <div className="footer-section">
        <h3>Kết nối với chúng tôi</h3>
        <div className="footer-social-icons">
          <FontAwesomeIcon icon={faFacebook} className="footer-social-icon"/>
          <FontAwesomeIcon icon={faYoutube} className="footer-social-icon"/>
          <FontAwesomeIcon icon={faInstagram} className="footer-social-icon"/>
        </div>
      </div>

      <div className="footer-section">
        <h3>Hỗ trợ khách hàng</h3>
        <ul>
          <li><a href="#">Chính sách đổi trả</a></li>
          <li><a href="#">Chính sách bảo hành</a></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
