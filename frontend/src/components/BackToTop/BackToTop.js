import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import './BackToTop.css';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');

  useEffect(() => {
    // Lắng nghe cuộn trên window (cho User pages)
    const onWindowScroll = () => {
      if (window.scrollY > 300) setVisible(true);
      else if (!document.querySelector('.ad-main')?.scrollTop) setVisible(false);
    };

    // Lắng nghe cuộn trên .ad-main (cho Admin pages)
    const onAdminScroll = (e) => {
      if (e.target.scrollTop > 300) setVisible(true);
      else if (window.scrollY <= 300) setVisible(false);
    };

    window.addEventListener('scroll', onWindowScroll);

    // Tìm phần tử ad-main và thêm event listener
    const adMain = document.querySelector('.ad-main');
    if (adMain) {
        adMain.addEventListener('scroll', onAdminScroll);
    }

    return () => {
      window.removeEventListener('scroll', onWindowScroll);
      if (adMain) {
        adMain.removeEventListener('scroll', onAdminScroll);
      }
    };
  }, []);

  const scrollToTop = () => {
    // Cuộn window
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Cuộn .ad-main (nếu đang ở trang Admin)
    const adMain = document.querySelector('.ad-main');
    if (adMain) {
        adMain.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Vị trí linh hoạt: Admin (92px), User (165px)
  const bottomStyle = isAdminPage ? '92px' : '165px';

  return (
    <button
      id="back-to-top-btn"
      className={`back-to-top ${visible ? 'visible' : ''}`}
      onClick={scrollToTop}
      aria-label="Về đầu trang"
      title="Về đầu trang"
      style={{ bottom: bottomStyle }}
    >
      ↑
    </button>
  );
}
