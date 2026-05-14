import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPostByIdQuery } from '../../../features/post/postApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faUser, faListUl, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import './AdminPostDetail.css';

const AdminPostDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tocOpen, setTocOpen] = useState(true);
    const { data: post, isLoading, isError } = useGetPostByIdQuery(id);

    if (isLoading) return <div className="admin-loading">Đang tải nội dung bài viết...</div>;
    if (isError || !post) return <div className="admin-error">Không tìm thấy bài viết.</div>;

    return (
        <div className="admin-post-detail-container">
            <div className="admin-detail-header">
                <button className="btn-back" onClick={() => navigate('/admin/posts')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                </button>
                <h2>Chi tiết bài viết</h2>
            </div>

            <div className="admin-post-content-wrapper">
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

                                {section.create_table && section.create_table.trim() !== '' && (
                                    <div
                                        className="section-table"
                                        dangerouslySetInnerHTML={{ __html: section.create_table }}
                                    />
                                )}

                                {post.images?.[idx] && (
                                    <div className="section-image">
                                        <img src={post.images[idx]} alt={section.headling} />
                                    </div>
                                )}
                            </section>
                        ))}
                    </div>

                    {post.images?.length > (post.total_content?.length || 0) && (
                        <div className="additional-images">
                            {post.images.slice(post.total_content.length).map((img, i) => (
                                <img key={i} src={img} alt={`img-${i}`} />
                            ))}
                        </div>
                    )}
                </article>
            </div>
        </div>
    );
};

export default AdminPostDetail;
