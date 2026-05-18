import React, { useState } from 'react';
import './AdminStock.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faTrash, faFileExport, faWarehouse, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';
import {
    useGetStocksQuery,
    useGetLowStockAlertsQuery,
    useUpdateStockMutation,
    useResetStockMutation,
} from '../../../features/services/stockApi';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';

dayjs.extend(utc);

export default function AdminStock() {
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [sortField, setSortField] = useState('newest');
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowOnly, setShowLowOnly] = useState(false);

    // Inline edit state
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const { data: queryData, isLoading, refetch } = useGetStocksQuery({
        page, limit, search: searchTerm, sortField, lowStock: showLowOnly,
    });

    const { data: lowStockData } = useGetLowStockAlertsQuery();

    const [updateStock] = useUpdateStockMutation();
    const [resetStock] = useResetStockMutation();

    const stocks = queryData?.data || [];
    const totalPages = queryData?.totalPages || 1;
    const totalItems = queryData?.totalItems || 0;
    const lowCount = lowStockData?.count || 0;

    // ── Inline edit ──
    const handleEditStart = (item) => {
        setEditingId(item._id);
        setEditValue(item.stock);
    };

    const handleEditCancel = () => {
        setEditingId(null);
        setEditValue('');
    };

    const handleEditSave = async (id) => {
        const val = parseInt(editValue);
        if (isNaN(val) || val < 0) {
            Swal.fire('Lỗi', 'Số lượng tồn kho phải là số nguyên không âm.', 'error');
            return;
        }
        try {
            const res = await updateStock({ id, stock: val }).unwrap();
            setEditingId(null);
            if (res.low_stock) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Cập nhật thành công',
                    text: '⚠️ Sản phẩm này sắp hết hàng!',
                    confirmButtonColor: '#f0a500',
                });
            } else {
                Swal.fire({ icon: 'success', title: 'Cập nhật tồn kho thành công!', timer: 1500, showConfirmButton: false });
            }
        } catch (err) {
            Swal.fire('Lỗi', err?.data?.message || 'Cập nhật thất bại.', 'error');
        }
    };

    // ── Reset stock ──
    const handleReset = async (item) => {
        const result = await Swal.fire({
            title: 'Reset tồn kho?',
            html: `Bạn có chắc muốn reset tồn kho của <b>${item.prod_name}</b> về <b>0</b>?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#c62828',
            cancelButtonColor: '#888',
            confirmButtonText: 'Đồng ý',
            cancelButtonText: 'Hủy',
        });
        if (result.isConfirmed) {
            try {
                await resetStock(item._id).unwrap();
                Swal.fire({ icon: 'success', title: 'Đã reset tồn kho về 0!', timer: 1400, showConfirmButton: false });
            } catch (err) {
                Swal.fire('Lỗi', err?.data?.message || 'Thao tác thất bại.', 'error');
            }
        }
    };

    // ── Export Excel ──
    const handleExport = () => {
        if (!stocks.length) {
            Swal.fire('Thông báo', 'Không có dữ liệu để xuất!', 'info');
            return;
        }
        const dataToExport = stocks.map((s, idx) => ({
            'STT': (page - 1) * limit + idx + 1,
            'Tên sản phẩm': s.prod_name,
            'Danh mục': s.category_name,
            'Tồn kho': s.stock,
            'Đã bán': s.quantity_sold,
            'Trạng thái': s.stock === 0 ? 'Hết hàng' : s.low_stock ? 'Sắp hết' : 'Còn hàng',
            'Ngày tạo': s.create_at ? dayjs(s.create_at).utc().format('DD/MM/YYYY HH:mm:ss') : '',
            'Ngày sửa': s.update_at ? dayjs(s.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : '',
        }));
        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Tồn kho');
        XLSX.writeFile(wb, 'Quan_ly_ton_kho.xlsx');
    };

    // ── Stock badge ──
    const StockBadge = ({ stock, lowStock }) => {
        if (stock === 0) return <span className="stock-badge zero">🚫 Hết hàng</span>;
        if (lowStock) return <span className="stock-badge low">⚠️ {stock}</span>;
        return <span className="stock-badge normal">✅ {stock}</span>;
    };

    return (
        <div className="admin-stock">
            <h1><FontAwesomeIcon icon={faWarehouse} style={{ marginRight: 10, color: '#4a90e2' }} />Quản lý tồn kho</h1>

            {/* Low Stock Alert Banner */}
            {lowCount > 0 && (
                <div className="stock-alert-banner">
                    <FontAwesomeIcon icon={faTriangleExclamation} className="alert-icon" />
                    Có <span className="alert-count">{lowCount}</span> sản phẩm sắp hết hàng!
                    <button
                        className="btn-view-low"
                        onClick={() => { setShowLowOnly(!showLowOnly); setPage(1); }}
                    >
                        {showLowOnly ? 'Xem tất cả' : 'Xem sắp hết'}
                    </button>
                </div>
            )}

            {/* Controls */}
            <div className="stock-controls">
                <div className="stock-controls-left">
                    <label>
                        Hiển thị:
                        <select value={limit} onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                        </select>
                    </label>
                    <button className="btn-stock-export" onClick={handleExport}>
                        <FontAwesomeIcon icon={faFileExport} />
                        Export Excel
                    </button>
                </div>

                <div className="stock-controls-right">
                    <input
                        className="stock-search"
                        type="text"
                        placeholder="🔍 Tìm theo tên hoặc danh mục..."
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                    />
                    <label>
                        Sắp xếp:
                        <select value={sortField} onChange={(e) => { setSortField(e.target.value); setPage(1); }}>
                            <option value="newest">Mới nhất</option>
                            <option value="oldest">Cũ nhất</option>
                            <option value="az">A → Z</option>
                            <option value="za">Z → A</option>
                        </select>
                    </label>
                </div>
            </div>

            {/* Table */}
            {isLoading ? (
                <div className="stock-loading">⏳ Đang tải dữ liệu tồn kho...</div>
            ) : stocks.length === 0 ? (
                <div className="stock-empty">📦 Không có dữ liệu tồn kho.</div>
            ) : (
                <div className="stock-table-wrapper">
                    <table className="stock-table">
                        <thead>
                            <tr>
                                <th>STT</th>
                                <th>Tên sản phẩm</th>
                                <th>Danh mục</th>
                                <th>Tồn kho</th>
                                <th>Đã bán</th>
                                <th>Ngày tạo</th>
                                <th>Ngày sửa</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stocks.map((item, idx) => (
                                <tr
                                    key={item._id}
                                    className={item.low_stock ? 'low-stock-row' : ''}
                                >
                                    <td>{(page - 1) * limit + idx + 1}</td>
                                    <td style={{ fontWeight: 600 }}>{item.prod_name}</td>
                                    <td>{item.category_name}</td>
                                    <td>
                                        {editingId === item._id ? (
                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                <input
                                                    className="stock-edit-input"
                                                    type="number"
                                                    min={0}
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleEditSave(item._id);
                                                        if (e.key === 'Escape') handleEditCancel();
                                                    }}
                                                />
                                                <button className="btn-save-stock" onClick={() => handleEditSave(item._id)}>✓</button>
                                                <button className="btn-cancel-stock" onClick={handleEditCancel}>✕</button>
                                            </div>
                                        ) : (
                                            <StockBadge stock={item.stock} lowStock={item.low_stock} />
                                        )}
                                    </td>
                                    <td>{item.quantity_sold}</td>
                                    <td>{item.create_at ? dayjs(item.create_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                                    <td>{item.update_at ? dayjs(item.update_at).utc().format('DD/MM/YYYY HH:mm:ss') : '---'}</td>
                                    <td>
                                        <div className="stock-actions">
                                            <button
                                                className="btn-icon edit"
                                                title="Cập nhật tồn kho"
                                                onClick={() => handleEditStart(item)}
                                            >
                                                <FontAwesomeIcon icon={faPenToSquare} />
                                            </button>
                                            <button
                                                className="btn-icon delete"
                                                title="Reset tồn kho về 0"
                                                onClick={() => handleReset(item)}
                                            >
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="stock-pagination">
                    <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>← Trang trước</button>
                    <span>Trang {page} / {totalPages} (Tổng: {totalItems})</span>
                    <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>Trang sau →</button>
                </div>
            )}
        </div>
    );
}
