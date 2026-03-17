import './Home.css';
import Header from '../../components/Header/Header'
import Footer from "../../components/Footer/Footer";
import { useNavigate} from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import ProductsList from '../../components/ProductsList/ProductsList';
// import products from '../../data/products';
import slide1 from '../../assets/slide1.png';
import slide2 from '../../assets/slide2.png';
import slide3 from '../../assets/slide3.png';
import { useGetProductsQuery } from "../../features/product/productApi.js";
function Home({ isAuthenticated, setIsAuthenticated }){
    const slugify = (str) => {
        return str
          .normalize('NFD')                   // tách dấu khỏi ký tự gốc
          .replace(/[\u0300-\u036f]/g, '')    // xóa các dấu
          .replace(/đ/g, 'd')                 // đ -> d
          .replace(/Đ/g, 'D')
          .replace(/\s+/g, '-')               // space -> dấu gạch ngang
          .toLowerCase();
      };
    const {data: products = [], isLoading} = useGetProductsQuery();
    const navigate = useNavigate();
    const slides = [slide1, slide2, slide3];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []); 

    const featuredCategories = ['Toàn bộ', 'Vợt cầu lông', 'Giày cầu lông', 'Túi cầu lông'];
    const [selectedCategory, setSelectedCategory] = useState('Toàn bộ');

    const filteredProducts =
        selectedCategory === 'Toàn bộ'
        ? products
        : products.filter((p) => p.category_id.category_name === selectedCategory);


    const categories = [
        { name: 'Giày cầu lông', image: 'https://down-vn.img.susercontent.com/file/vn-11134201-7r98o-ls91kx36r1g3bc' },
        { name: 'Quấn cán vợt', image: 'https://product.hstatic.net/1000362402/product/86ad06cbf98eb55240500946d051c9d6_337b0eb27d7d40299beb8747b0a81f9d_69e8fa4ee1ce4116941bfbc67ff930a6.jpg' },
        { name: 'Vợt cầu lông', image: 'https://product.hstatic.net/1000387607/product/badminton-racket-aypp124-1-b_31fb9d6486384868b9454907ad2dc2fe_master.jpg' },
        { name: 'Túi cầu lông', image: 'https://votcaulongshop.vn/wp-content/uploads/2024/08/balo-victor-china-open.jpg' },
    ];

    return(
    <>
        <Header/>
        
        <div className="home-container">
         {/* SLIDER */}
            <div className="slider">
            <div className="slides" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                {slides.map((slide, index) => (
                <img key={index} src={slide} alt={`Slide ${index}`} />
                ))}
            </div>
            <button onClick={() => setCurrentSlide((currentSlide - 1 + slides.length) % slides.length)}>&lt;</button>
            <button onClick={() => setCurrentSlide((currentSlide + 1) % slides.length)}>&gt;</button>
            </div>
        {/* CATEGORY */}
            <div className="category-section">
                <p className="home-section-title">Danh mục</p>
                <div className="category-list">
                    {categories.map((cat, i) => (
                    <div key={i} className="category-item" onClick = {() => navigate(`/products/${encodeURIComponent(slugify(cat.name))}`)}>
                        <img src={cat.image} alt={cat.name} />
                        <p>{cat.name}</p>
                        
                        {/* <div className="arrow-icon">{i === 0 || i === categories.length - 1 ? '>' : ''}</div> */}
                    </div>
                    ))}
                </div>
            </div>
        {/* SẢN PHẨM NỔI BẬT */}
        <div className="featured-products">
            <p className="home-section-title">Sản phẩm nổi bật</p>
            <div className="tabs">
                {featuredCategories.map((cat) => (
                <button
                    key={cat}
                    className={selectedCategory === cat ? 'active' : ''}
                    onClick={() => setSelectedCategory(cat)}
                >
                    {cat}
                </button>
                ))}
            </div>
            <ProductsList
                products={filteredProducts}
                fullWidth={false}
                isPaginated={false}
            />
            </div>
        </div> 
        <Footer/>
    </>
    );
}

export default Home;