import './Home.css';
import Header from '../../components/Header/Header'
import Footer from "../../components/Footer/Footer";
import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import ProductsList from '../../components/ProductsList/ProductsList';
import slide1 from '../../assets/slide1.png';
import slide2 from '../../assets/slide2.png';
import slide3 from '../../assets/slide3.png';
import { useGetProductsQuery } from "../../features/product/productApi.js";
import { useGetCategoriesQuery } from "../../features/services/categoryApi";
import { useGetGeneralImagesQuery } from "../../features/services/generalImageApi.js";
import { Link } from 'react-router-dom';
import ProductCard from '../../components/ProductCard/ProductCard';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

function Home({ isAuthenticated, setIsAuthenticated }) {
    const slugify = (str) => {
        return str
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .replace(/\s+/g, '-')
            .toLowerCase();
    };
    const { data: products = [], isLoading: productsLoading } = useGetProductsQuery();
    const { data: dbCategories = [], isLoading: catsLoading } = useGetCategoriesQuery();
    const { data: slidesData } = useGetGeneralImagesQuery({ search: 'Slides' });
    const navigate = useNavigate();

    // Get slides from DB, fallback to local assets
    const dbSlides = slidesData?.data?.find(img => img.image_name === 'Slides')?.image || [];
    const slides = dbSlides.length > 0 ? dbSlides : [slide1, slide2, slide3];

    const [currentSlide, setCurrentSlide] = useState(0);

    useEffect(() => {
        if (slides.length === 0) return;
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 3000);
        return () => clearInterval(timer);
    }, [slides.length]);

    // Filter categories that are marked as 'Featured' from DB (case-insensitive)
    const dbFeaturedCats = dbCategories
        .filter(cat => cat.featured_category?.toLowerCase() === 'featured')
        .map(cat => cat.category_name);

    const featuredCategories = ['Toàn bộ', ...dbFeaturedCats];
    const [selectedCategory, setSelectedCategory] = useState('Toàn bộ');

    const filteredProducts =
        selectedCategory === 'Toàn bộ'
            ? products
            : products.filter((p) => p.category_id?.category_name === selectedCategory);

    // Filter new products (created within the last 3 days)
    const newProducts = products.filter(p => {
        if (!p.create_at) return false;
        const createAt = new Date(p.create_at);
        const today = new Date();
        const diffTime = Math.abs(today - createAt);
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays <= 3;
    }).sort((a, b) => new Date(b.create_at) - new Date(a.create_at));

    // Group products by category for sliders
    const productsByCategory = dbCategories.map(cat => ({
        ...cat,
        products: products.filter(p => p.category_id?._id === cat._id)
    })).filter(cat => cat.products.length > 0);

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

                {/* CATEGORY SLIDER */}
                <div className="category-section">
                    <p className="home-section-title">Danh mục</p>
                    {catsLoading ? (
                        <p style={{ textAlign: 'center' }}>Đang tải danh mục...</p>
                    ) : (
                        <Swiper
                            modules={[Autoplay, Pagination, Navigation]}
                            spaceBetween={20}
                            slidesPerView={2}
                            autoplay={{ delay: 3000, disableOnInteraction: false }}
                            pagination={{ clickable: true }}
                            navigation={true}
                            breakpoints={{
                                640: { slidesPerView: 3 },
                                768: { slidesPerView: 4 },
                                1024: { slidesPerView: 5 },
                                1200: { slidesPerView: 6 },
                            }}
                            className="category-swiper"
                        >
                            {dbCategories.map((cat) => (
                                <SwiperSlide key={cat._id}>
                                    <div
                                        className="category-item"
                                        onClick={() => navigate(`/products/${encodeURIComponent(slugify(cat.category_name))}`)}
                                        style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}
                                    >
                                        <img src={cat.image} alt={cat.category_name} />
                                        <p>{cat.category_name}</p>
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    )}
                </div>

                {/* NEW PRODUCTS SLIDER */}
                {newProducts.length > 0 && (
                    <div className="category-products-section">
                        <div className="section-header">
                            <div className="section-title-box">
                                Sản Phẩm Mới
                            </div>
                            <Link to="/products" className="view-more-link">
                                Xem thêm <span style={{ fontSize: '18px' }}>→</span>
                            </Link>
                        </div>
                        <Swiper
                            modules={[Autoplay, Navigation]}
                            spaceBetween={20}
                            slidesPerView={1}
                            autoplay={{ delay: 3500, disableOnInteraction: false }}
                            navigation={true}
                            breakpoints={{
                                480: { slidesPerView: 2 },
                                768: { slidesPerView: 3 },
                                1024: { slidesPerView: 4 },
                                1200: { slidesPerView: 4.5 },
                            }}
                            className="product-swiper"
                        >
                            {newProducts.map((product) => (
                                <SwiperSlide key={product._id}>
                                    <ProductCard product={product} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                )}

                {/* PRODUCT LISTS BY CATEGORY SLIDERS */}
                {productsByCategory.map((cat) => (
                    <div key={cat._id} className="category-products-section">
                        <div className="section-header">
                            <div className="section-title-box">
                                {cat.category_name}
                            </div>
                            <Link to={`/products/${encodeURIComponent(slugify(cat.category_name))}`} className="view-more-link">
                                Xem thêm <span style={{ fontSize: '18px' }}>→</span>
                            </Link>
                        </div>
                        <Swiper
                            modules={[Autoplay, Navigation]}
                            spaceBetween={20}
                            slidesPerView={1}
                            autoplay={{ delay: 4000, disableOnInteraction: false }}
                            navigation={true}
                            breakpoints={{
                                480: { slidesPerView: 2 },
                                768: { slidesPerView: 3 },
                                1024: { slidesPerView: 4 },
                                1200: { slidesPerView: 4.5 },
                            }}
                            className="product-swiper"
                        >
                            {cat.products.map((product) => (
                                <SwiperSlide key={product._id}>
                                    <ProductCard product={product} />
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                ))}

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