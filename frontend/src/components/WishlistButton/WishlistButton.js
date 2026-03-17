import React from 'react';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../app/store/authSlice';
import { useGetUserWishlistQuery, useAddToWishlistMutation } from '../../features/services/wishlistApi';
import './WishlistButton.css';

const WishlistButton = ({ productId, size = 'normal' }) => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const { data: wishlistData } = useGetUserWishlistQuery(undefined, { skip: !isAuthenticated });
  const [addToWishlist, { isLoading }] = useAddToWishlistMutation();

  const wishlistItems = wishlistData?.data || [];
  const isInWishlist = wishlistItems.some(item => 
    (item.prod_id?._id || item.prod_id) === productId
  );

  const handleToggle = async (e) => {
    e.stopPropagation(); // Ngăn event lan lên (vd: click card navigate)
    if (!isAuthenticated) {
      alert('Vui lòng đăng nhập để sử dụng chức năng yêu thích!');
      return;
    }
    try {
      await addToWishlist({ prod_id: productId }).unwrap();
    } catch (err) {
      console.error('Lỗi toggle wishlist:', err);
    }
  };

  return (
    <button
      className={`wishlist-btn ${size} ${isInWishlist ? 'active' : ''}`}
      onClick={handleToggle}
      disabled={isLoading}
      title={isInWishlist ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'}
    >
      {isInWishlist ? '❤️' : '🤍'}
    </button>
  );
};

export default WishlistButton;
