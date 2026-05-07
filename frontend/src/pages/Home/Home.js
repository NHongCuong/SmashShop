import './Home.css';
import Header from '../../components/Header/Header'
import Footer from "../../components/Footer/Footer";
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import ProductsList from '../../components/ProductsList/ProductsList';
// import products from '../../data/products';
import slide1 from '../../assets/slide1.png';
import slide2 from '../../assets/slide2.png';
import slide3 from '../../assets/slide3.png';
import { useGetProductsQuery } from "../../features/product/productApi.js";
function Home({ isAuthenticated, setIsAuthenticated }) {
    const slugify = (str) => {
        return str
            .normalize('NFD')                   // tách dấu khỏi ký tự gốc
            .replace(/[\u0300-\u036f]/g, '')    // xóa các dấu
            .replace(/đ/g, 'd')                 // đ -> d
            .replace(/Đ/g, 'D')
            .replace(/\s+/g, '-')               // space -> dấu gạch ngang
            .toLowerCase();
    };
    const { data: products = [], isLoading } = useGetProductsQuery();
    const navigate = useNavigate();
    const slides = [slide1, slide2, slide3];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    const featuredCategories = ['Toàn bộ', 'Vợt cầu lông', 'Giày cầu lông', 'Túi cầu lông', 'Lưới cầu lông'];
    const [selectedCategory, setSelectedCategory] = useState('Toàn bộ');

    const filteredProducts =
        selectedCategory === 'Toàn bộ'
            ? products
            : products.filter((p) => p.category_id.category_name === selectedCategory);


    const categories = [
        { name: 'Giày cầu lông', image: 'https://res.cloudinary.com/dnv022ihm/image/upload/v1775365882/IE213/aihksf0gsm0gut7o9aoz.jpg' },
        { name: 'Quấn cán vợt', image: 'https://res.cloudinary.com/dnv022ihm/image/upload/v1778058184/quat-cau-long_lkvwlh.jpg' },
        { name: 'Vợt cầu lông', image: 'https://res.cloudinary.com/dnv022ihm/image/upload/v1777109294/IE213/zvirb9dorkblrp8vjgo1.webp' },
        { name: 'Túi cầu lông', image: 'https://res.cloudinary.com/dnv022ihm/image/upload/v1778057967/balo-victor-china-open_y4rjzf.jpg' },
        { name: 'Lưới cầu lông', image: 'https://res.cloudinary.com/dnv022ihm/image/upload/v1773124736/IE213/ihuthhlqpwe4xkaodbgp.jpg' },
    ];

    return (
        <>
            <Header />

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
                            <div key={i} className="category-item" onClick={() => navigate(`/products/${encodeURIComponent(slugify(cat.name))}`)}>
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
            <Footer />
        </>
    );
}

export default Home;