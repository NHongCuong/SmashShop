import React, { useState } from 'react';
import { useGetPostsQuery } from '../../features/post/postApi';
import { useGetCategoriesQuery } from '../../features/services/categoryApi';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faChevronRight, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import './Guide.css';

const Guide = () => {
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const limit = 6;

    const { data: categories } = useGetCategoriesQuery();
    const { data: postData, isLoading } = useGetPostsQuery({
        page,
        limit,
        search,
        categoryId,
        sort: 'latest'
    });

    const handleSearch = (e) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleCategoryClick = (id) => {
        setCategoryId(id === categoryId ? '' : id);
        setPage(1);
    };

    return (
        <div className="guide-page">
            <Header />
            
            <div className="guide-breadcrumb">
                <div className="container">
                    <Link to="/">Trang chủ</Link> <span>/</span> <span className="active">Hướng dẫn / Review</span>
                </div>
            </div>

            <div className="guide-container container">
                <div className="guide-main-header">
                    <h1>Hướng Dẫn / Review</h1>
                    <div className="guide-search-wrapper">
                        <input 
                            type="text" 
                            placeholder="Tìm kiếm bài viết..." 
                            value={search}
                            onChange={handleSearch}
                        />
                        <FontAwesomeIcon icon={faSearch} />
                    </div>
                </div>

                <div className="guide-layout">
                    {/* Left side: Post List */}
                    <div className="guide-content-left">
                        {isLoading ? (
                            <div className="guide-loading">Đang tải bài viết...</div>
                        ) : postData?.posts?.length > 0 ? (
                            <>
                                <div className="post-grid">
                                    {postData.posts.map(post => (
                                        <Link key={post._id} to={`/huong-dan/${post._id}`} className="post-card">
                                            <div className="post-card-img">
                                                <img src={post.images?.[0] || 'https://via.placeholder.com/300x200'} alt={post.title} />
                                            </div>
                                            <div className="post-card-info">
                                                <p className="post-card-cat">{post.category_id?.category_name}</p>
                                                <h3 className="post-card-title">{post.title}</h3>
                                                <p className="post-card-excerpt">
                                                    {post.total_content?.[0]?.content?.substring(0, 100)}...
                                                </p>
                                                <div className="post-card-meta">
                                                    <span><FontAwesomeIcon icon={faCalendarAlt} /> {new Date(post.createdAt).toLocaleDateString()}</span>
                                                    <span className="read-more">Xem chi tiết <FontAwesomeIcon icon={faChevronRight} /></span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                {postData.totalPages > 1 && (
                                    <div className="guide-pagination">
                                        <button 
                                            disabled={page === 1} 
                                            onClick={() => setPage(page - 1)}
                                        >
                                            Trang trước
                                        </button>
                                        <div className="page-numbers">
                                            {[...Array(postData.totalPages)].map((_, idx) => (
                                                <button 
                                                    key={idx + 1} 
                                                    className={page === idx + 1 ? 'active' : ''}
                                                    onClick={() => setPage(idx + 1)}
                                                >
                                                    {idx + 1}
                                                </button>
                                            ))}
                                        </div>
                                        <button 
                                            disabled={page === postData.totalPages} 
                                            onClick={() => setPage(page + 1)}
                                        >
                                            Trang sau
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="no-posts">Không tìm thấy bài viết nào phù hợp.</div>
                        )}
                    </div>

                    {/* Right side: Sidebar */}
                    <aside className="guide-sidebar-right">
                        <div className="sidebar-section">
                            <h3 className="sidebar-title">Danh mục tin tức</h3>
                            <ul className="cat-list">
                                <li className={!categoryId ? 'active' : ''} onClick={() => handleCategoryClick('')}>
                                    <FontAwesomeIcon icon={faChevronRight} /> Tất cả bài viết
                                </li>
                                {categories?.map(cat => (
                                    <li 
                                        key={cat._id} 
                                        className={cat._id === categoryId ? 'active' : ''}
                                        onClick={() => handleCategoryClick(cat._id)}
                                    >
                                        <FontAwesomeIcon icon={faChevronRight} /> {cat.category_name}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="sidebar-section">
                            <h3 className="sidebar-title">Tin mới nhất</h3>
                            <div className="recent-posts">
                                {postData?.posts?.slice(0, 3).map(post => (
                                    <Link key={post._id} to={`/huong-dan/${post._id}`} className="recent-item">
                                        <div className="recent-info">
                                            <p className="recent-title">{post.title}</p>
                                            <span className="recent-date">{new Date(post.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default Guide;
