import React, { useState, useEffect } from 'react';
import './QuickContact.css';

export default function QuickContact() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(prev => !prev);
  };

  // Thêm bộ lắng nghe sự kiện để có thể mở QuickContact từ ProductDetail hoặc bất cứ đâu
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('quick-contact:open', handleOpen);
    return () => window.removeEventListener('quick-contact:open', handleOpen);
  }, []);

  // Add/remove class to body to dynamically shift the BackToTop button up when open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('quick-contact-open');
    } else {
      document.body.classList.remove('quick-contact-open');
    }
    return () => {
      document.body.classList.remove('quick-contact-open');
    };
  }, [isOpen]);

  return (
    <div className="quick-contact-container">
      {/* Floating Action Menu Items (Visible only when open) */}
      <div className={`quick-contact-menu ${isOpen ? 'show' : ''}`}>

        {/* Contact list card */}
        <div className="quick-contact-card">
          {/* Messenger Row */}
          <a
            href="https://m.me/hong.96.cuong"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-contact-item messenger-item"
          >
            <div className="quick-contact-brand-icon">
              <svg viewBox="0 0 28 28" width="32" height="32">
                <defs>
                  <linearGradient id="messenger-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#006aff" />
                    <stop offset="30%" stopColor="#a107ff" />
                    <stop offset="70%" stopColor="#ff3683" />
                    <stop offset="100%" stopColor="#ff7f54" />
                  </linearGradient>
                </defs>
                <path
                  fill="url(#messenger-grad)"
                  d="M14 2C7.1 2 1.5 7.3 1.5 13.9c0 3.5 1.6 6.6 4.3 8.7V26l3.3-1.8c1.5.4 3.1.6 4.8.6 6.9 0 12.5-5.3 12.5-11.9S20.9 2 14 2zm1.6 15.6l-2.9-3.1-5.7 3.1 6.2-6.6 3 3.1 5.6-3.1-6.2 6.6z"
                />
              </svg>
            </div>
            <span className="quick-contact-text">Messenger</span>
          </a>

          {/* Facebook Row */}
          <a
            href="https://www.facebook.com/hong.96.cuong"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-contact-item facebook-item"
          >
            <div className="quick-contact-brand-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  fill="#1877f2"
                  d="M24 12a12 12 0 1 0-13.875 11.854v-8.385H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385A12 12 0 0 0 24 12z"
                />
              </svg>
            </div>
            <span className="quick-contact-text">Facebook</span>
          </a>

          {/* Zalo Row */}
          <a
            href="https://zalo.me/0776856666"
            target="_blank"
            rel="noopener noreferrer"
            className="quick-contact-item zalo-item"
          >
            <div className="quick-contact-brand-icon">
              <svg viewBox="0 0 24 24" width="32" height="32">
                <path
                  fill="#0068ff"
                  d="M12 2C6.48 2 2 5.92 2 10.75c0 2.62 1.33 4.96 3.44 6.44-.14.75-.52 2.37-.62 2.81-.13.56.21.55.44.4 0 0 2.21-1.46 3.08-2.03.85.24 1.74.38 2.66.38 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"
                />
                <text
                  x="12"
                  y="14"
                  fontFamily="'Inter', sans-serif, Arial"
                  fontWeight="bold"
                  fontSize="6.8"
                  fill="#ffffff"
                  textAnchor="middle"
                  letterSpacing="0.4"
                >
                  Zalo
                </text>
              </svg>
            </div>
            <span className="quick-contact-text">Zalo</span>
          </a>

          {/* Phone Hotline Row */}
          <a href="tel:0776856666" className="quick-contact-item phone-item">
            <div className="quick-contact-brand-icon phone-circle-icon">
              <svg viewBox="0 0 36 36" width="32" height="32">
                <circle cx="18" cy="18" r="18" fill="#2eb846" />
                <path
                  fill="#ffffff"
                  d="M24.7 20.8c-.8-.8-2.1-.8-2.9 0l-1 1c-.2-.1-.5-.3-.9-.5-.6-.4-1.2-.9-1.8-1.5-.6-.6-1.1-1.2-1.5-1.8-.2-.4-.4-.7-.5-.9l1-1c.8-.8.8-2.1 0-2.9l-2.4-2.4c-.8-.8-2.1-.8-2.9 0l-1.5 1.5c-1.1 1.1-1.3 2.7-.6 4.1 1.2 2.4 3.1 4.7 5.5 7.1 2.4 2.4 4.7 4.3 7.1 5.5 1.4.7 3 .5 4.1-.6l1.5-1.5c.8-.8.8-2.1 0-2.9l-2.9-2.9z"
                />
              </svg>
            </div>
            <span className="quick-contact-text phone-number">077.685.6666</span>
          </a>
        </div>

        {/* Location Button */}
        <a
          href="https://www.google.com/maps/search/67%2F7+Tr%C6%B0%C6%A1ng+%C4%90%E1%BB%8Bnh,+Khu+V%E1%BB%B1c+V%C4%A9nh+Ph%C3%BA,+Ph%C6%B0%E1%BB%9Dng+An+Nh%C6%A1n+B%E1%BA%AFc,+T%E1%BB%89nh+Gia+Lai"
          target="_blank"
          rel="noopener noreferrer"
          className="quick-contact-sub-btn location-btn"
          title="Bản đồ đường đi"
        >
          <svg
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="#2eb846"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        </a>

        {/* Close 'X' Button */}
        <button onClick={toggleOpen} className="quick-contact-sub-btn close-btn" title="Đóng liên hệ">
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="#2eb846"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

      </div>

      {/* Main Floating Pulse Contact Button (Always visible) */}
      <button
        onClick={toggleOpen}
        className={`quick-contact-main-btn ${isOpen ? 'active' : ''}`}
        title="Liên hệ SmashShop"
      >
        {isOpen ? (
          /* Phone receiver active or just chat bubble */
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM9 11H7V9h2v2zm4 0h-2V9h2v2zm4 0h-2V9h2v2z" />
          </svg>
        ) : (
          /* Wiggling phone icon */
          <svg viewBox="0 0 24 24" width="28" height="28" fill="#ffffff" className="phone-pulse-icon">
            <path d="M6.62 10.79c1.44 2.82 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
          </svg>
        )}
      </button>
    </div>
  );
}
