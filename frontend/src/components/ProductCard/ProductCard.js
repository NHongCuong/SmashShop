import React, { useState, useEffect } from "react";
import "./ProductCard.css";
import { useNavigate } from "react-router-dom";
import WishlistButton from "../WishlistButton/WishlistButton";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  
  // Lấy tất cả ảnh từ model mới (image là mảng string trong ProductImage)
  const allImages = (product.images || []).flatMap(img => 
    Array.isArray(img.image) ? img.image : [img.image]
  );

  const [currentImage, setCurrentImage] = useState(allImages[0] || '');

  // Reset currentImage khi product thay đổi (ví đổi trang hoặc filter)
  useEffect(() => {
    setCurrentImage(allImages[0] || '');
  }, [product]);

  return (
    <div className="product-card" onClick={() => navigate(`/product/${product.product_url || product._id || product.id}`)}>
      {product.discount > 0 && (
        <div className="product-discount-badge">-{Math.round(product.discount)}%</div>
      )}
      <div className="product-card-wishlist">
        <WishlistButton productId={product._id || product.id} size="small" />
      </div>
      
      <div className="product-card-image-wrapper">
        <img src={currentImage} loading='lazy' alt={product.prod_name} className="product-image" />
      </div>

      <div className="product-card-thumbnails" onClick={(e) => e.stopPropagation()}>
        {allImages.slice(0, 5).map((img, idx) => (
          <div 
            key={idx} 
            className={`thumb-item ${currentImage === img ? 'active' : ''}`}
            onMouseEnter={() => setCurrentImage(img)}
          >
            <img src={img} alt={`thumb-${idx}`} />
          </div>
        ))}
        {allImages.length > 5 && <div className="thumb-more">+{allImages.length - 5}</div>}
      </div>

      <h3 className="product-name">{product.prod_name}</h3>
      {product.discount > 0 ? (
        <div className="product-price-wrapper">
          <span className="product-price-discounted">
            {Math.round(product.price * (1 - product.discount / 100)).toLocaleString()}đ
          </span>
          <span className="product-price-original">
            {product.price.toLocaleString()}đ
          </span>
        </div>
      ) : (
        <p className="product-price">{product.price.toLocaleString()} đ</p>
      )}
    </div>
  );
};

export default ProductCard;
