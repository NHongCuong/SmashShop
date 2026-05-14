import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetPostByIdQuery, useGetPostsQuery } from '../../features/post/postApi';
import Header from '../../components/Header/Header';
import Footer from '../../components/Footer/Footer';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faListUl } from '@fortawesome/free-solid-svg-icons';
import './PostDetail.css';
import logo from "../../assets/logohcshop.png";

const PostDetail = () => {
    const { id } = useParams();
    const [tocOpen, setTocOpen] = useState(true);
    const { data: post, isLoading, isError } = useGetPostByIdQuery(id);
    const { data: recentPosts } = useGetPostsQuery({ limit: 5, sort: 'latest' });

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [id]);

    if (isLoading) return <div className="post-detail-loading">Đang tải nội dung bài viết...</div>;
    if (isError || !post) return <div className="post-detail-error">Không tìm thấy bài viết.</div>;

    return (
        <div className="post-detail-page">
            <Header />

            <div className="guide-breadcrumb">
                <div className="container">
                    <Link to="/">Trang chủ</Link> <span>/</span>
                    <Link to="/huong-dan">Hướng dẫn / Review</Link> <span>/</span>
                    <span className="active">{post.title}</span>
                </div>
            </div>

            <div className="post-detail-container container">
                <div className="post-detail-layout">
                    <article className="post-main-content">
                        <div className="post-header">
                            <span className="post-category-tag">{post.category_id?.category_name}</span>
                            <h1 className="post-full-title">{post.title}</h1>
                            <div className="post-meta-strip">
                                <span><FontAwesomeIcon icon={faCalendarAlt} /> Ngày đăng: {new Date(post.createdAt).toLocaleDateString()}</span>
                                <span><FontAwesomeIcon icon={faCalendarAlt} /> Cập nhật: {new Date(post.updatedAt).toLocaleDateString()}</span>
                                <span><FontAwesomeIcon icon={faUser} /> Tác giả: {post.user_id?.name}</span>
                            </div>
                        </div>

                        {/* Heading Table of Contents */}
                        <div className={`post-toc ${!tocOpen ? 'toc-collapsed' : ''}`}>
                            <div className="toc-title">
                                <span className="toc-title-text">
                                    <FontAwesomeIcon icon={faListUl} /> Mục lục bài viết
                                </span>
                                <button
                                    className="ez-toc-icon-toggle"
                                    onClick={() => setTocOpen(prev => !prev)}
                                    title={tocOpen ? 'Ẩn mục lục' : 'Hiện mục lục'}
                                >
                                    <span className="ez-toc-icon-toggle-span">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </span>
                                </button>
                            </div>
                            <div className="toc-list-wrapper">
                                <ul className="toc-list">
                                    {post.total_content?.map((section, idx) => (
                                        <li key={idx}>
                                            <a href={`#section-${idx}`}>
                                                {idx + 1}. {section.headling}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>

                        <div className="post-body">
                            {post.total_content?.map((section, idx) => (
                                <section key={idx} id={`section-${idx}`} className="content-section">
                                    <h2 className="section-headling">{section.headling}</h2>
                                    <div className="section-text" dangerouslySetInnerHTML={{ __html: section.content.replace(/\n/g, '<br />') }} />
                                    {/* Render table if exists */}
                                    {section.create_table && section.create_table.trim() !== '' && (
                                        <div
                                            className="section-table"
                                            dangerouslySetInnerHTML={{ __html: section.create_table }}
                                        />
                                    )}
                                    {/* Show image if available per section */}
                                    {post.images?.[idx] && (
                                        <div className="section-image">
                                            <img src={post.images[idx]} alt={section.headling} />
                                        </div>
                                    )}
                                </section>
                            ))}
                        </div>

                        {/* Remaining images if any */}
                        {post.images?.length > (post.total_content?.length || 0) && (
                            <div className="additional-images">
                                {post.images.slice(post.total_content.length).map((img, i) => (
                                    <img key={i} src={img} alt={`img-${i}`} />
                                ))}
                            </div>
                        )}
                    </article>

                    <aside className="post-detail-sidebar">
                        <div className="sidebar-box">
                            <h3 className="sidebar-box-title">Bài viết mới nhất</h3>
                            <div className="sidebar-recent-list">
                                {recentPosts?.posts?.map(p => (
                                    <Link key={p._id} to={`/huong-dan/${p.post_url || p._id}`} className="sidebar-recent-item">
                                        <img src={p.images?.[0] || 'https://via.placeholder.com/80'} alt={p.title} />
                                        <div className="sidebar-recent-info">
                                            <p className="sidebar-recent-title">{p.title}</p>
                                            <span className="sidebar-recent-date">{new Date(p.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>

                        <div className="sidebar-ad-box">
                            <img src={logo} alt="HC SHOP" />
                            <p>HC SHOP - Hệ thống cửa hàng cầu lông hàng đầu Việt Nam</p>
                            <Link to="/products" className="shop-now-btn" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>Mua sắm ngay</Link>
                        </div>
                    </aside>
                </div>
            </div>

            <Footer />
        </div>
    );
};

export default PostDetail;
