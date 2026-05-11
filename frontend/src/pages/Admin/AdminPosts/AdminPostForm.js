import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGetPostByIdQuery, useCreatePostMutation, useUpdatePostMutation } from '../../../features/post/postApi';
import { useGetCategoriesQuery } from '../../../features/services/categoryApi';
import { useGetAdminUsersQuery } from '../../../features/user/userApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrash, faArrowLeft, faSave, faTable, faEye, faCode, faRefresh } from '@fortawesome/free-solid-svg-icons';
import Swal from 'sweetalert2';
import './AdminPostForm.css';

// Utility: generate slug from Vietnamese title (max 80 chars)
const slugify = (text) => {
    if (!text) return '';
    const map = {
        à:'a',á:'a',ả:'a',ã:'a',ạ:'a',
        ă:'a',ắ:'a',ằ:'a',ẳ:'a',ẵ:'a',ặ:'a',
        â:'a',ấ:'a',ầ:'a',ẩ:'a',ẫ:'a',ậ:'a',
        è:'e',é:'e',ẻ:'e',ẽ:'e',ẹ:'e',
        ê:'e',ế:'e',ề:'e',ể:'e',ễ:'e',ệ:'e',
        ì:'i',í:'i',ỉ:'i',ĩ:'i',ị:'i',
        ò:'o',ó:'o',ỏ:'o',õ:'o',ọ:'o',
        ô:'o',ố:'o',ồ:'o',ổ:'o',ỗ:'o',ộ:'o',
        ơ:'o',ớ:'o',ờ:'o',ở:'o',ỡ:'o',ợ:'o',
        ù:'u',ú:'u',ủ:'u',ũ:'u',ụ:'u',
        ư:'u',ứ:'u',ừ:'u',ử:'u',ữ:'u',ự:'u',
        ỳ:'y',ý:'y',ỷ:'y',ỹ:'y',ỵ:'y',đ:'d',
    };
    return text.toLowerCase()
        .replace(/[\u00c0-\u024f]/g, c => map[c] || c)
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 80);
};

// ---- Table Builder Component ----
const TableBuilder = ({ value, onChange }) => {
    const [mode, setMode] = useState('builder'); // 'builder' | 'html' | 'preview'
    const [rows, setRows] = useState(3);
    const [cols, setCols] = useState(2);
    const [tableData, setTableData] = useState(() => {
        // Init empty table
        return Array.from({ length: 3 }, (_, r) =>
            Array.from({ length: 2 }, (_, c) => (r === 0 ? `Cột ${c + 1}` : ''))
        );
    });
    const [initialized, setInitialized] = useState(false);

    // Parse existing HTML to table data when editing
    useEffect(() => {
        if (value && !initialized) {
            try {
                const parser = new DOMParser();
                const doc = parser.parseFromString(value, 'text/html');
                const tableEl = doc.querySelector('table');
                if (tableEl) {
                    const parsedRows = Array.from(tableEl.querySelectorAll('tr')).map(tr =>
                        Array.from(tr.querySelectorAll('th,td')).map(cell => cell.innerText || cell.textContent)
                    );
                    if (parsedRows.length > 0) {
                        setTableData(parsedRows);
                        setRows(parsedRows.length);
                        setCols(parsedRows[0]?.length || 2);
                        setInitialized(true);
                    }
                }
            } catch (_) {}
        }
    }, [value, initialized]);

    const buildHtml = useCallback((data) => {
        if (!data || data.length === 0) return '';
        const headerRow = data[0];
        const bodyRows = data.slice(1);
        const thead = `<thead><tr>${headerRow.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${bodyRows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>`;
        return `<table class="post-table">${thead}${tbody}</table>`;
    }, []);

    const resizeTable = (newRows, newCols) => {
        const updated = Array.from({ length: newRows }, (_, r) =>
            Array.from({ length: newCols }, (_, c) => tableData[r]?.[c] ?? '')
        );
        setTableData(updated);
        setRows(newRows);
        setCols(newCols);
        onChange(buildHtml(updated));
    };

    const handleCellChange = (r, c, val) => {
        const updated = tableData.map((row, ri) =>
            row.map((cell, ci) => (ri === r && ci === c ? val : cell))
        );
        setTableData(updated);
        onChange(buildHtml(updated));
    };

    const addRow = () => resizeTable(rows + 1, cols);
    const addCol = () => resizeTable(rows, cols + 1);
    const removeRow = () => rows > 1 && resizeTable(rows - 1, cols);
    const removeCol = () => cols > 1 && resizeTable(rows, cols - 1);

    const handleHtmlChange = (html) => {
        onChange(html);
        setInitialized(false); // allow re-parse
    };

    const clearTable = () => {
        const empty = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => r === 0 ? `Cột ${c + 1}` : '')
        );
        setTableData(empty);
        onChange('');
        setInitialized(false);
    };

    return (
        <div className="table-builder">
            <div className="table-builder-tabs">
                <button type="button" className={mode === 'builder' ? 'tab-active' : ''} onClick={() => setMode('builder')}>
                    <FontAwesomeIcon icon={faTable} /> Tạo bảng
                </button>
                <button type="button" className={mode === 'html' ? 'tab-active' : ''} onClick={() => setMode('html')}>
                    <FontAwesomeIcon icon={faCode} /> Chỉnh HTML
                </button>
                <button type="button" className={mode === 'preview' ? 'tab-active' : ''} onClick={() => { setMode('preview'); }}>
                    <FontAwesomeIcon icon={faEye} /> Xem trước
                </button>
                <button type="button" className="tab-clear" onClick={clearTable} title="Xóa bảng">
                    <FontAwesomeIcon icon={faRefresh} /> Xóa bảng
                </button>
            </div>

            {mode === 'builder' && (
                <div className="table-builder-body">
                    <div className="table-controls">
                        <div className="table-control-group">
                            <label>Số hàng:</label>
                            <button type="button" onClick={removeRow}>-</button>
                            <span>{rows}</span>
                            <button type="button" onClick={addRow}>+</button>
                        </div>
                        <div className="table-control-group">
                            <label>Số cột:</label>
                            <button type="button" onClick={removeCol}>-</button>
                            <span>{cols}</span>
                            <button type="button" onClick={addCol}>+</button>
                        </div>
                    </div>
                    <div className="table-editable-wrapper">
                        <table className="table-editable">
                            <tbody>
                                {tableData.map((row, r) => (
                                    <tr key={r} className={r === 0 ? 'table-header-row' : ''}>
                                        {row.map((cell, c) => (
                                            <td key={c}>
                                                <input
                                                    type="text"
                                                    value={cell}
                                                    onChange={(e) => handleCellChange(r, c, e.target.value)}
                                                    placeholder={r === 0 ? `Tiêu đề cột ${c + 1}` : 'Nội dung...'}
                                                />
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="table-hint">* Hàng đầu tiên sẽ là tiêu đề (header) của bảng.</p>
                </div>
            )}

            {mode === 'html' && (
                <div className="table-html-edit">
                    <textarea
                        rows={10}
                        value={value || ''}
                        onChange={e => handleHtmlChange(e.target.value)}
                        placeholder='<table class="post-table">...</table>'
                    />
                </div>
            )}

            {mode === 'preview' && (
                <div className="table-preview">
                    {value ? (
                        <div dangerouslySetInnerHTML={{ __html: value }} />
                    ) : (
                        <p className="table-hint">Chưa có bảng. Hãy tạo bảng ở tab "Tạo bảng".</p>
                    )}
                </div>
            )}
        </div>
    );
};

// ---- Main Form ----
const AdminPostForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = !!id;

    const { data: postData, isLoading: postLoading } = useGetPostByIdQuery(id, { skip: !isEdit });
    const { data: categories } = useGetCategoriesQuery();
    const { data: userData } = useGetAdminUsersQuery({ limit: 100 });

    // Filter admin users
    const adminUsers = userData?.data?.filter(u => u.role === 'admin') || [];

    const [createPost, { isLoading: creating }] = useCreatePostMutation();
    const [updatePost, { isLoading: updating }] = useUpdatePostMutation();

    const [formData, setFormData] = useState({
        title: '',
        post_url: '',
        category_id: '',
        user_id: '',
        images: [''],
        total_content: [{ headling: '', content: '', create_table: '' }]
    });

    useEffect(() => {
        if (isEdit && postData) {
            setFormData({
                title: postData.title || '',
                post_url: postData.post_url || '',
                category_id: postData.category_id?._id || '',
                user_id: postData.user_id?._id || '',
                images: postData.images?.length > 0 ? [...postData.images] : [''],
                total_content: postData.total_content?.length > 0
                    ? postData.total_content.map(c => ({
                        headling: c.headling || '',
                        content: c.content || '',
                        create_table: c.create_table || ''
                    }))
                    : [{ headling: '', content: '', create_table: '' }]
            });
        }
    }, [isEdit, postData]);

    const [urlAutoGenerated, setUrlAutoGenerated] = useState(!isEdit);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const updated = { ...prev, [name]: value };
            // Auto-generate post_url from title if not manually edited
            if (name === 'title' && urlAutoGenerated) {
                updated.post_url = slugify(value);
            }
            if (name === 'post_url') {
                setUrlAutoGenerated(false); // User is manually editing URL
            }
            return updated;
        });
    };

    const handleContentChange = (index, field, value) => {
        const newContent = [...formData.total_content];
        newContent[index] = { ...newContent[index], [field]: value };
        setFormData(prev => ({ ...prev, total_content: newContent }));
    };

    const addContentRow = () => {
        setFormData(prev => ({
            ...prev,
            total_content: [...prev.total_content, { headling: '', content: '', create_table: '' }]
        }));
    };

    const removeContentRow = (index) => {
        if (formData.total_content.length === 1) return;
        const newContent = formData.total_content.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, total_content: newContent }));
    };

    const handleImageChange = (index, value) => {
        const newImages = [...formData.images];
        newImages[index] = value;
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const addImageField = () => {
        setFormData(prev => ({ ...prev, images: [...prev.images, ''] }));
    };

    const removeImageField = (index) => {
        const newImages = formData.images.filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, images: newImages }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.category_id || !formData.user_id) {
            Swal.fire('Lỗi', 'Vui lòng chọn danh mục và tác giả', 'error');
            return;
        }

        const cleanedData = {
            ...formData,
            images: formData.images.filter(img => img.trim() !== ''),
            total_content: formData.total_content.filter(
                c => c.headling.trim() !== '' || c.content.trim() !== '' || c.create_table.trim() !== ''
            )
        };

        try {
            if (isEdit) {
                await updatePost({ id, ...cleanedData }).unwrap();
                Swal.fire('Thành công', 'Cập nhật bài viết thành công!', 'success');
            } else {
                await createPost(cleanedData).unwrap();
                Swal.fire('Thành công', 'Thêm bài viết mới thành công!', 'success');
            }
            navigate('/admin/posts');
        } catch (err) {
            console.error('Submit error:', err);
            Swal.fire('Lỗi', 'Có lỗi xảy ra, vui lòng thử lại.', 'error');
        }
    };

    if (isEdit && postLoading) return <div className="admin-loading">Đang tải dữ liệu bài viết...</div>;

    return (
        <div className="admin-post-form-container">
            <div className="form-header">
                <button className="btn-back" onClick={() => navigate('/admin/posts')}>
                    <FontAwesomeIcon icon={faArrowLeft} /> Quay lại
                </button>
                <h2>{isEdit ? 'Chỉnh sửa bài viết' : 'Thêm bài viết mới'}</h2>
            </div>

            <form onSubmit={handleSubmit} className="admin-post-form">
                <div className="form-section">
                    <label>Tiêu đề bài viết</label>
                    <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập tiêu đề..."
                    />
                </div>

                <div className="form-section">
                    <label>
                        URL Bài viết
                        {urlAutoGenerated && <span className="url-auto-tag">tự động</span>}
                    </label>
                    <div className="url-input-row">
                        <span className="url-prefix">/huong-dan/</span>
                        <input
                            type="text"
                            name="post_url"
                            value={formData.post_url}
                            onChange={handleInputChange}
                            placeholder="ten-bai-viet-seo-friendly"
                            className={urlAutoGenerated ? 'url-auto' : ''}
                        />
                        <button
                            type="button"
                            className="btn-regen-url"
                            onClick={() => {
                                setFormData(prev => ({ ...prev, post_url: slugify(prev.title) }));
                                setUrlAutoGenerated(false);
                            }}
                            title="Tạo lại từ tiêu đề"
                        >
                            ↺
                        </button>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-section">
                        <label>Danh mục</label>
                        <select name="category_id" value={formData.category_id} onChange={handleInputChange} required>
                            <option value="">-- Chọn danh mục --</option>
                            {categories?.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-section">
                        <label>Tác giả (Admin)</label>
                        <select name="user_id" value={formData.user_id} onChange={handleInputChange} required>
                            <option value="">-- Chọn tác giả --</option>
                            {adminUsers.map(user => (
                                <option key={user._id} value={user._id}>{user.name}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-section">
                    <label>Hình ảnh (URLs)</label>
                    {formData.images.map((img, idx) => (
                        <div key={idx} className="image-input-row">
                            <input
                                type="text"
                                value={img}
                                onChange={(e) => handleImageChange(idx, e.target.value)}
                                placeholder="http://..."
                            />
                            {formData.images.length > 1 && (
                                <button type="button" className="btn-remove" onClick={() => removeImageField(idx)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" className="btn-add-more" onClick={addImageField}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm ảnh
                    </button>
                </div>

                <div className="form-section contents-section">
                    <label>Nội dung chi tiết</label>
                    {formData.total_content.map((content, idx) => (
                        <div key={idx} className="content-block">
                            <div className="content-header">
                                <span>Phần {idx + 1}</span>
                                {formData.total_content.length > 1 && (
                                    <button type="button" className="btn-remove-content" onClick={() => removeContentRow(idx)}>
                                        <FontAwesomeIcon icon={faTrash} /> Xóa phần này
                                    </button>
                                )}
                            </div>
                            <input
                                type="text"
                                placeholder="Heading (Mục lục)..."
                                value={content.headling}
                                onChange={(e) => handleContentChange(idx, 'headling', e.target.value)}
                            />

                            <div className="ai-toggle-row" style={{ display: 'flex', gap: '1rem', margin: '10px 0' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name={`contentMode-${idx}`}
                                        checked={content.content !== 'Using AI'}
                                        onChange={() => handleContentChange(idx, 'content', '')}
                                    />
                                    Tự nhập
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer' }}>
                                    <input
                                        type="radio"
                                        name={`contentMode-${idx}`}
                                        checked={content.content === 'Using AI'}
                                        onChange={() => handleContentChange(idx, 'content', 'Using AI')}
                                    />
                                    Using AI
                                </label>
                            </div>

                            <textarea
                                placeholder="Nội dung chi tiết..."
                                rows="6"
                                value={content.content}
                                onChange={(e) => handleContentChange(idx, 'content', e.target.value)}
                            />

                            {/* Table Builder */}
                            <div className="table-builder-section">
                                <div className="table-builder-label">
                                    <FontAwesomeIcon icon={faTable} /> Bảng dữ liệu (tùy chọn)
                                </div>
                                <TableBuilder
                                    value={content.create_table}
                                    onChange={(html) => handleContentChange(idx, 'create_table', html)}
                                />
                            </div>
                        </div>
                    ))}
                    <button type="button" className="btn-add-content" onClick={addContentRow}>
                        <FontAwesomeIcon icon={faPlus} /> Thêm đoạn nội dung (Heading & Content)
                    </button>
                </div>

                <button type="submit" className="btn-submit" disabled={creating || updating}>
                    <FontAwesomeIcon icon={faSave} /> {isEdit ? 'Cập nhật bài viết' : 'Lưu bài viết'}
                </button>
            </form>
        </div>
    );
};

export default AdminPostForm;
