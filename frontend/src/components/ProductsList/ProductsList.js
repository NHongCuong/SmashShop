import ProductCard from "../ProductCard/ProductCard";
import "./ProductsList.css";
import { useState } from "react";

  const ProductsList = ({ products, fullWidth, isPaginated, currentPage, setCurrentPage, totalPages }) => {
    return (
      <div className="products-list-container">
        <div className={`products-list ${fullWidth ? "full-width" : "narrow-width"}`}>
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
  
        {isPaginated && totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Trang trước
            </button>
            <span>
              Trang {currentPage} / {totalPages}
            </span>
            <button
              className="pagination-btn"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Trang sau
            </button>
          </div>
        )}
      </div>
    );
  };

export default ProductsList;
