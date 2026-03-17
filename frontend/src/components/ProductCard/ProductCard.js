import React from "react";
import "./ProductCard.css";
import { useNavigate } from "react-router-dom";
import WishlistButton from "../WishlistButton/WishlistButton";

const ProductCard = ({ product }) => {
  const navigate = useNavigate();
  return (
    <div className="product-card" onClick={() => navigate(`/product/${product._id || product.id}`)}>
      <div className="product-card-wishlist">
        <WishlistButton productId={product._id || product.id} size="small" />
      </div>
      <img src={product.images?.find(prod => prod?.is_primary_image)?.image || ''} loading='lazy' alt={product.prod_name} className="product-image" />
      <h3 className="product-name">{product.prod_name}</h3>
      <p className="product-price">{product.price.toLocaleString()} đ</p>
    </div>
  );
};

export default ProductCard;
