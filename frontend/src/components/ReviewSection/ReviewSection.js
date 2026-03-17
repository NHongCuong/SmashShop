import React, { useState } from 'react';
import { useGetReviewsByProductQuery, useCreateReviewMutation, useDeleteReviewMutation } from '../../features/services/reviewApi';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../app/store/authSlice';
import './ReviewSection.css';

const StarRating = ({ rating, onRate, interactive = false }) => {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`star ${star <= (hover || rating) ? 'filled' : ''} ${interactive ? 'interactive' : ''}`}
          onClick={() => interactive && onRate(star)}
          onMouseEnter={() => interactive && setHover(star)}
          onMouseLeave={() => interactive && setHover(0)}
        >
          ★
        </span>
      ))}
    </div>
  );
};

const ReviewSection = ({ productId }) => {
  const { data, isLoading } = useGetReviewsByProductQuery(productId);
  const [createReview, { isLoading: isSubmitting }] = useCreateReviewMutation();
  const [deleteReview] = useDeleteReviewMutation();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const currentUserId = localStorage.getItem('userId');

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const reviews = data?.data || [];
  const avgRating = data?.avgRating || 0;
  const totalReviews = data?.totalReviews || 0;

  // Kiểm tra user đã review chưa
  const hasReviewed = reviews.some(r => r.user_id?._id === currentUserId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      alert('Vui lòng chọn số sao đánh giá!');
      return;
    }
    try {
      await createReview({ prod_id: productId, rating, comment }).unwrap();
      setRating(0);
      setComment('');
    } catch (err) {
      const msg = err?.data?.message || 'Có lỗi xảy ra khi gửi đánh giá';
      alert(msg);
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Bạn có chắc muốn xóa đánh giá này?')) {
      try {
        await deleteReview({ reviewId, productId }).unwrap();
      } catch (err) {
        alert('Không thể xóa đánh giá');
      }
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  if (isLoading) return <div className="review-loading">Đang tải đánh giá...</div>;

  return (
    <div className="review-section">
      <div className="review-heading">ĐÁNH GIÁ SẢN PHẨM</div>

      {/* Tổng quan */}
      <div className="review-summary">
        <div className="review-avg">
          <span className="avg-number">{avgRating}</span>
          <span className="avg-max">/5</span>
        </div>
        <StarRating rating={Math.round(avgRating)} />
        <span className="review-count">({totalReviews} đánh giá)</span>
      </div>

      {/* Form viết review */}
      {isAuthenticated && !hasReviewed && (
        <form className="review-form" onSubmit={handleSubmit}>
          <h4>Viết đánh giá của bạn</h4>
          <div className="form-rating">
            <label>Đánh giá: </label>
            <StarRating rating={rating} onRate={setRating} interactive />
          </div>
          <textarea
            placeholder="Nhập nhận xét của bạn (không bắt buộc)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
          </button>
        </form>
      )}

      {isAuthenticated && hasReviewed && (
        <p className="review-already">✅ Bạn đã đánh giá sản phẩm này.</p>
      )}

      {!isAuthenticated && (
        <p className="review-login-hint">Đăng nhập để viết đánh giá sản phẩm.</p>
      )}

      {/* Danh sách đánh giá */}
      <div className="review-list">
        {reviews.length === 0 ? (
          <p className="no-reviews">Chưa có đánh giá nào cho sản phẩm này.</p>
        ) : (
          reviews.map((review) => (
            <div key={review._id} className="review-item">
              <div className="review-item-header">
                <strong className="review-user">{review.user_id?.name || 'Người dùng'}</strong>
                <span className="review-date">{formatDate(review.create_at)}</span>
              </div>
              <StarRating rating={review.rating} />
              {review.comment && <p className="review-comment">{review.comment}</p>}
              {review.user_id?._id === currentUserId && (
                <button className="review-delete-btn" onClick={() => handleDelete(review._id)}>
                  Xóa
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ReviewSection;
