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
    const [toastMessage, setToastMessage] = useState('');
    const { data: post, isLoading, isError } = useGetPostByIdQuery(id);
    const { data: recentPosts } = useGetPostsQuery({ limit: 5, sort: 'latest' });

    const handleCopyLink = () => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setToastMessage('Đã sao chép liên kết bài viết!');
                setTimeout(() => setToastMessage(''), 3000);
            })
            .catch(() => {
                setToastMessage('Không thể sao chép liên kết.');
                setTimeout(() => setToastMessage(''), 3000);
            });
    };

    const handleShareSocial = (platform, url) => {
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setToastMessage(`Đã sao chép link! Bạn có thể dán để chia sẻ lên ${platform}.`);
                setTimeout(() => {
                    setToastMessage('');
                    window.open(url, '_blank', 'noopener,noreferrer');
                }, 1800);
            })
            .catch(() => {
                window.open(url, '_blank', 'noopener,noreferrer');
            });
    };

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

                        {/* Share Article Section */}
                        <div className="post-share-section">
                            <span className="share-title">Chia sẻ bài viết:</span>
                            <div className="share-buttons">
                                {/* Messenger Share */}
                                <a
                                    href={`https://www.facebook.com/dialog/send?link=${encodeURIComponent(window.location.href)}&app_id=291494419107518&redirect_uri=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="share-btn share-messenger"
                                    title="Chia sẻ qua Messenger"
                                >
                                    <svg viewBox="0 0 28 28" width="36" height="36">
                                        <defs>
                                            <linearGradient id="share-messenger-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                                                <stop offset="0%" stopColor="#006aff" />
                                                <stop offset="30%" stopColor="#a107ff" />
                                                <stop offset="70%" stopColor="#ff3683" />
                                                <stop offset="100%" stopColor="#ff7f54" />
                                            </linearGradient>
                                        </defs>
                                        <path
                                            fill="url(#share-messenger-grad)"
                                            d="M14 2C7.1 2 1.5 7.3 1.5 13.9c0 3.5 1.6 6.6 4.3 8.7V26l3.3-1.8c1.5.4 3.1.6 4.8.6 6.9 0 12.5-5.3 12.5-11.9S20.9 2 14 2zm1.6 15.6l-2.9-3.1-5.7 3.1 6.2-6.6 3 3.1 5.6-3.1-6.2 6.6z"
                                        />
                                    </svg>
                                </a>

                                {/* TikTok Share */}
                                <button
                                    onClick={() => handleShareSocial('TikTok', 'https://www.tiktok.com/')}
                                    className="share-btn share-tiktok"
                                    title="Chia sẻ lên TikTok"
                                >
                                    <svg viewBox="0 0 40 40" width="36" height="36">
                                        <circle cx="20" cy="20" r="20" fill="#010101" />
                                        <path
                                            fill="#ffffff"
                                            d="M25.4 15.5c-1.3-.9-1.9-2-2.1-3.4h-3.4v10.3c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2v-3.5c-.4-.1-.8-.1-1.2-.1-3.8 0-6.9 3.1-6.9 6.9 0 3.8 3.1 6.9 6.9 6.9 3.8 0 6.9-3.1 6.9-6.9V16.8c1 .7 2.1 1.1 3.4 1.2v-2.5z"
                                        />
                                    </svg>
                                </button>

                                {/* YouTube Share */}
                                <button
                                    onClick={() => handleShareSocial('YouTube', 'https://www.youtube.com/')}
                                    className="share-btn share-youtube"
                                    title="Chia sẻ lên YouTube"
                                >
                                    <svg viewBox="0 0 40 40" width="36" height="36">
                                        <rect x="2" y="2" width="36" height="36" rx="8" fill="#FF0000" />
                                        <path fill="#ffffff" d="M16 12v16l10-8z" />
                                    </svg>
                                </button>

                                {/* Facebook Share */}
                                <a
                                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="share-btn share-facebook"
                                    title="Chia sẻ lên Facebook"
                                >
                                    <svg viewBox="0 0 24 24" width="36" height="36">
                                        <path
                                            fill="#1877f2"
                                            d="M24 12a12 12 0 1 0-13.875 11.854v-8.385H7.078V12h3.047V9.356c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874V12h3.328l-.532 3.469h-2.796v8.385A12 12 0 0 0 24 12z"
                                        />
                                    </svg>
                                </a>

                                {/* Zalo Share */}
                                <a
                                    href={`https://sp.zalo.me/share_inline?url=${encodeURIComponent(window.location.href)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="share-btn share-zalo"
                                    title="Chia sẻ qua Zalo"
                                >
                                    <svg viewBox="0 0 24 24" width="36" height="36">
                                        <path
                                            fill="#0068ff"
                                            d="M12 2C6.48 2 2 5.92 2 10.75c0 2.62 1.33 4.96 3.44 6.44-.14.75-.52 2.37-.62 2.81-.13.56.21.55.44.4 0 0 2.21-1.46 3.08-2.03.85.24 1.74.38 2.66.38 5.52 0 10-3.92 10-8.75S17.52 2 12 2z"
                                        />
                                        <text
                                            x="12"
                                            y="14"
                                            fontFamily="'Inter', sans-serif, Arial"
                                            fontWeight="bold"
                                            fontSize="6.8"
                                            fill="#ffffff"
                                            textAnchor="middle"
                                            letterSpacing="0.4"
                                        >
                                            Zalo
                                        </text>
                                    </svg>
                                </a>

                                {/* Copy Link Share */}
                                <button
                                    onClick={handleCopyLink}
                                    className="share-btn share-copy"
                                    title="Sao chép liên kết"
                                >
                                    <svg viewBox="0 0 40 40" width="36" height="36">
                                        <circle cx="20" cy="20" r="20" fill="#4d4d4d" />
                                        <path
                                            fill="#ffffff"
                                            d="M24.8 15.2c-1-1-2.7-1-3.8 0L17.7 18c-1 1-1 2.7 0 3.8.5.5 1.1.7 1.9.7s1.4-.3 1.9-.7l.9-.9c.3-.3.3-.8 0-1.1s-.8-.3-1.1 0l-.9.9c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l3.3-3.3c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-.5.5c-.3.3-.3.8 0 1.1s.8.3 1.1 0l.5-.5c1-1 1-2.7 0-3.8z"
                                        />
                                        <path
                                            fill="#ffffff"
                                            d="M19.3 21.6c-.3-.3-.8-.3-1.1 0l-.5.5c-1 1-1 2.7 0 3.8 1 1 2.7 1 3.8 0l3.3-3.3c1-1 1-2.7 0-3.8-.5-.5-1.1-.7-1.9-.7s-1.4.3-1.9.7l-.9.9c-.3.3-.3.8 0 1.1s.8.3 1.1 0l.9-.9c.4-.4 1-.4 1.4 0s.4 1 0 1.4l-3.3 3.3c-.4.4-1.1.4-1.4 0s-.4-1.1 0-1.4l.5-.5c.3-.3.3-.8 0-1.1z"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Custom Toast Alert */}
                            {toastMessage && (
                                <div className="share-toast">
                                    {toastMessage}
                                </div>
                            )}
                        </div>
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
