import React, { useState } from 'react';
import { useGetPostsQuery, useDeletePostMutation, useImportPostsMutation } from '../../../features/post/postApi';
import { useGetAdminUsersQuery } from '../../../features/user/userApi';
import { useGetCategoriesQuery } from '../../../features/services/categoryApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faFileImport, faFileExport, faPlus } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';
import './AdminPosts.css';

const AdminPosts = () => {
    const navigate = useNavigate();
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sort, setSort] = useState('latest');
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('');

    const { data, isLoading, isError, refetch } = useGetPostsQuery({
        page,
        limit,
        sort,
        search,
        categoryId,
    });

    const { data: categories } = useGetCategoriesQuery();
    const [deletePost] = useDeletePostMutation();
    const [importPosts] = useImportPostsMutation();

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Bạn có chắc chắn?',
            text: "Xóa bài viết này sẽ không thể hoàn tác!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Vâng, xóa đi!',
            cancelButtonText: 'Hủy'
        });

        if (result.isConfirmed) {
            try {
                await deletePost(id).unwrap();
                Swal.fire('Đã xóa!', 'Bài viết đã được xóa thành công.', 'success');
            } catch (err) {
                Swal.fire('Lỗi!', 'Không thể xóa bài viết.', 'error');
            }
        }
    };

    const handleExportExcel = () => {
        if (!data?.posts) return;

        const exportData = data.posts.map((post, index) => ({
            STT: (page - 1) * limit + index + 1,
            Title: post.title,
            Image: post.images?.[0] || '',
            Content_Heading: post.total_content?.map(c => c.headling).join('; '),
            Content_Body: post.total_content?.map(c => c.content).join('; '),
            Category: post.category_id?.category_name,
            Author: post.user_id?.name,
            Created_At: new Date(post.createdAt).toLocaleDateString(),
            Updated_At: new Date(post.updatedAt).toLocaleDateString(),
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Posts");
        XLSX.writeFile(wb, "admin_posts.xlsx");
    };

    const { data: userData } = useGetAdminUsersQuery({ limit: 100 });
    const adminUsers = userData?.data || [];

    const handleImportExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            const bstr = evt.target.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws);

            // Map Excel data to Post model
            const mappedData = jsonData.map(item => {
                // Find Category ID
                const cat = categories?.find(c => c.category_name === item.Category);
                // Find User ID (Author)
                const author = adminUsers?.find(u => u.name === item.Author);

                // Parse Content_Heading and Content_Body (separated by '; ')
                const headings = item.Content_Heading ? item.Content_Heading.split('; ') : [];
                const bodies = item.Content_Body ? item.Content_Body.split('; ') : [];
                const total_content = headings.map((h, i) => ({
                    headling: h,
                    content: bodies[i] || ''
                }));

                return {
                    title: item.Title || item.title,
                    images: item.Image ? [item.Image] : [],
                    total_content: total_content,
                    category_id: cat?._id,
                    user_id: author?._id || adminUsers?.[0]?._id, // Default to first admin if not found
                };
            }).filter(item => item.title && item.category_id); // Ensure required fields exist

            if (mappedData.length === 0) {
                Swal.fire('Lỗi!', 'Dữ liệu Excel không hợp lệ hoặc thiếu thông tin bắt buộc.', 'error');
                return;
            }

            try {
                await importPosts(mappedData).unwrap();
                Swal.fire('Thành công!', `Đã import ${mappedData.length} bài viết.`, 'success');
                refetch();
            } catch (err) {
                console.error('Import error:', err);
                Swal.fire('Lỗi!', 'Import thất bại. Vui lòng kiểm tra lại định dạng file.', 'error');
            }
        };
        reader.readAsBinaryString(file);
    };

    if (isLoading) return <div className="admin-loading">Đang tải dữ liệu...</div>;
    if (isError) return <div className="admin-error">Có lỗi xảy ra khi tải bài viết.</div>;

    return (
        <div className="admin-posts-container">
            <div className="admin-posts-header">
                <h2>Quản lý bài viết</h2>
                <div className="admin-posts-actions">
                    <Link to="/admin/posts/add" className="btn-add">
                        <FontAwesomeIcon icon={faPlus} /> Thêm bài viết
                    </Link>
                    <button className="btn-export" onClick={handleExportExcel}>
                        <FontAwesomeIcon icon={faFileExport} /> Xuất Excel
                    </button>
                    <label className="btn-import">
                        <FontAwesomeIcon icon={faFileImport} /> Nhập Excel
                        <input type="file" hidden onChange={handleImportExcel} accept=".xlsx, .xls" />
                    </label>
                </div>
            </div>

            <div className="admin-posts-filters">
                <div className="filter-group">
                    <input
                        type="text"
                        placeholder="Tìm kiếm tiêu đề hoặc danh mục..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="search-input"
                    />
                    <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                        <option value="">Tất cả danh mục</option>
                        {categories?.map(cat => (
                            <option key={cat._id} value={cat._id}>{cat.category_name}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <select value={sort} onChange={(e) => setSort(e.target.value)}>
                        <option value="latest">Mới nhất</option>
                        <option value="oldest">Cũ nhất</option>
                        <option value="a-z">A-Z (Tiêu đề)</option>
                        <option value="z-a">Z-A (Tiêu đề)</option>
                    </select>
                    <select value={limit} onChange={(e) => { setLimit(e.target.value); setPage(1); }}>
                        <option value="10">Hiển thị 10</option>
                        <option value="20">Hiển thị 20</option>
                        <option value="50">Hiển thị 50</option>
                        <option value="100">Hiển thị 100</option>
                    </select>
                </div>
            </div>

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Ảnh</th>
                        <th>Tiêu đề</th>
                        <th>Nội dung tóm tắt</th>
                        <th>Danh mục</th>
                        <th>Tác giả</th>
                        <th>Ngày tạo</th>
                        <th>Ngày sửa</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {data.posts.map((post, index) => (
                        <tr key={post._id}>
                            <td>{(page - 1) * limit + index + 1}</td>
                            <td>
                                <img src={post.images?.[0] || 'https://via.placeholder.com/50'} alt={post.title} className="post-thumb" />
                            </td>
                            <td 
                                className="post-title-cell" 
                                onClick={() => navigate(`/admin/posts/${post._id}`)}
                                style={{ cursor: 'pointer', color: '#007bff' }}
                            >
                                {post.title}
                            </td>
                            <td>
                                <div className="post-summary">
                                    <strong>{post.total_content?.[0]?.headling}</strong>: {post.total_content?.[0]?.content?.substring(0, 50)}...
                                </div>
                            </td>
                            <td>{post.category_id?.category_name}</td>
                            <td>{post.user_id?.name}</td>
                            <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                            <td title={new Date(post.updatedAt).toLocaleString()}>
                                {new Date(post.updatedAt).getTime() - new Date(post.createdAt).getTime() > 5000
                                    ? new Date(post.updatedAt).toLocaleDateString()
                                    : '---'}
                            </td>
                            <td className="actions-cell">
                                <button className="btn-edit" onClick={() => navigate(`/admin/posts/edit/${post._id}`)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="btn-delete" onClick={() => handleDelete(post._id)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="pagination">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                >
                    Trước
                </button>
                <span>Trang {page} / {data.totalPages}</span>
                <button
                    disabled={page === data.totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Sau
                </button>
            </div>
        </div>
    );
};

export default AdminPosts;
