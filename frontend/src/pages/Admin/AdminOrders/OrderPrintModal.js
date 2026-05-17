import React, { useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import './OrderPrintModal.css';
import { useGetGeneralImagesQuery } from '../../../features/services/generalImageApi';
import fallbackLogo from '../../../assets/logohcshop.png';

dayjs.extend(utc);

/* Convert an image URL to a base64 data URI so it works in blob: documents */
const toBase64 = async (src) => {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch {
    return src; // fallback
  }
};

/* ──────────────────────────────────────────────
   Helper: build a complete HTML document string
   that can be fed into a print window.
────────────────────────────────────────────── */
const buildPrintHTML = ({ order, orderDate, totalBeforeDiscount, discountAmount, total, logoSrc }) => {
  const formatDate = (date) => {
    if (!date) return '';
    return date.format('lúc HH:mm DD [tháng] MM, YYYY');
  };

  const statusText = order.status === 'Cancelled' ? 'Đã hủy đơn hàng' :
    order.paymentmethod === 'cod' ? 'Chưa thanh toán' :
      order.status === 'Succeeded' ? 'Đã thanh toán' :
        order.status === 'Pending' ? 'Đang chờ duyệt' :
          order.status === 'Processing' ? 'Đang xử lý' : order.status;

  const statusClass = order.status === 'Cancelled' ? 'status-cancelled' :
    order.paymentmethod === 'cod' ? 'status-pending' :
      order.status === 'Succeeded' ? 'status-succeeded' :
        order.status?.toLowerCase() || 'status-pending';

  const itemRows = (order.items || []).map((item, index) => {
    const productName = item.product?.prod_name || item.product?.name || 'Sản phẩm';
    const variantTags = item.selected_variants
      ? Object.entries(item.selected_variants).map(([k, v]) => `<span class="variant-tag">${k}: ${v}</span>`).join('')
      : '';
    const lineTotal = ((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN');
    const unitPrice = (item.price || 0).toLocaleString('vi-VN');

    return `
      <tr>
        <td class="tc">${index + 1}</td>
        <td>
          <div class="item-name"><strong>${productName}</strong></div>
          ${variantTags ? `<div class="item-variants">${variantTags}</div>` : ''}
        </td>
        <td class="tc">${item.quantity}</td>
        <td class="tc">${unitPrice}₫</td>
        <td class="tc">${lineTotal}₫</td>
        <td class="tc">${item.product?.warranty || 'Không bảo hành'}</td>
      </tr>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8"/>
  <title>Hóa đơn – ${order.order_id || ''}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
      @bottom-right {
        content: "Trang " counter(page);
        font-family: 'Inter', Arial, sans-serif;
        font-size: 11px;
        color: #777;
      }
    }
    @media print {
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { padding: 0; }
    }
    body { font-family: 'Inter', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 13px; color: #1f2937; line-height: 1.5; padding: 0; }
    
    /* ── Header ── */
    .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; gap: 20px; }
    .company-info { flex: 1; }
    .company-logo-img { height: 60px; width: auto; margin-bottom: 8px; }
    .company-tagline { font-size: 13px; color: #6b7280; margin-bottom: 12px; font-style: italic; }
    .company-details p { font-size: 11.5px; color: #4b5563; margin: 3px 0; }
    
    .invoice-meta { display: flex; flex-direction: column; align-items: flex-end; width: 340px; }
    .invoice-title { font-size: 26px; font-weight: 800; color: #111827; letter-spacing: 1px; text-align: right; width: 100%; }
    .invoice-sub-title { font-size: 12px; font-weight: 600; color: #9ca3af; letter-spacing: 2px; margin-top: -2px; margin-bottom: 15px; text-align: right; width: 100%; }
    
    .meta-row { display: grid; grid-template-columns: 100px 1fr; gap: 10px; width: 100%; font-size: 12px; margin: 4px 0; }
    .meta-label { color: #6b7280; }
    .meta-value { color: #111827; font-weight: 600; word-break: break-all; }
    .meta-value.highlight { color: #10b981; font-weight: 700; }
    .meta-value.status-succeeded { color: #10b981; }
    .meta-value.status-cancelled { color: #ef4444; }
    .meta-value.status-pending { color: #f59e0b; }

    .divider-double { border: none; border-top: 3px double #d1d5db; margin: 20px 0; }

    /* ── Info Sections ── */
    .invoice-info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 25px; margin-bottom: 25px; }
    .info-block { display: flex; flex-direction: column; }
    .info-block.border-left { border-left: 1px solid #e5e7eb; padding-left: 25px; }
    .section-title { font-size: 13px; font-weight: 700; color: #111827; border-bottom: 1.5px solid #10b981; padding-bottom: 5px; margin-bottom: 10px; letter-spacing: 0.5px; text-transform: uppercase; }
    
    .info-row { display: flex; font-size: 12px; margin: 4px 0; }
    .info-label { color: #6b7280; width: 110px; flex-shrink: 0; }
    .info-value { color: #1f2937; }

    /* ── Table ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 25px; font-size: 12px; }
    th { background-color: #f9fafb; border: 1px solid #d1d5db; color: #374151; font-weight: 700; padding: 10px 8px; text-transform: uppercase; font-size: 11px; }
    td { border: 1px solid #e5e7eb; padding: 10px 8px; vertical-align: middle; }
    thead { display: table-header-group; }
    .tc { text-align: center; }
    .tr { text-align: right; }
    
    .item-name { color: #111827; }
    .item-variants { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 3px; }
    .variant-tag { background-color: #f3f4f6; color: #4b5563; font-size: 10px; padding: 1px 5px; border-radius: 3px; border: 1px solid #e5e7eb; }

    /* ── Summary ── */
    .invoice-summary-section { display: grid; grid-template-columns: 1.2fr 1fr; gap: 25px; margin-bottom: 30px; page-break-inside: avoid; }
    .payment-note { background-color: #f9fafb; padding: 12px; border-radius: 6px; border-left: 3px solid #10b981; }
    .note-title { font-size: 12px; font-weight: 700; color: #374151; margin-bottom: 5px; }
    .payment-note ul { padding-left: 15px; margin: 0; }
    .payment-note li { font-size: 10px; color: #4b5563; margin: 2px 0; }
    
    .totals-block { display: flex; flex-direction: column; }
    .totals-row { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
    .totals-label { color: #4b5563; }
    .totals-value { font-weight: 600; color: #111827; }
    .totals-row.grand-total { font-size: 14px; font-weight: 800; border-top: 1px dotted #d1d5db; padding-top: 8px; margin-top: 5px; }
    .totals-row.grand-total .totals-value { color: #10b981; font-size: 16px; }

    /* ── Signatures ── */
    .invoice-signatures { display: flex; justify-content: space-around; margin-top: 20px; margin-bottom: 30px; page-break-inside: avoid; }
    .signature-box { text-align: center; width: 180px; }
    .signature-title { font-size: 12px; font-weight: 700; color: #111827; }
    .signature-note { font-size: 10px; color: #6b7280; font-style: italic; margin-top: 2px; }
    .signature-space { height: 60px; }
    .signature-name { font-size: 12px; font-weight: 700; color: #111827; border-top: 1px solid #d1d5db; padding-top: 5px; display: inline-block; min-width: 150px; }

    .invoice-footer { text-align: center; border-top: 1px solid #e5e7eb; padding-top: 15px; margin-top: 10px; page-break-inside: avoid; }
    .thank-you { font-size: 13px; font-weight: 700; color: #10b981; margin-bottom: 3px; }
    .footer-tagline { font-size: 11px; color: #6b7280; }
  </style>
</head>
<body>
  <div class="invoice-header">
    <div class="company-info">
      <img src="${logoSrc}" class="company-logo-img" alt="Logo"/>
      <p class="company-tagline">Chuyên thiết bị và phụ kiện thể thao chính hãng</p>
      <div class="company-details">
        <p>Địa chỉ: 67/7 Trương Định, KV Vĩnh Phú, P An Nhơn Bắc, Gia Lai</p>
        <p>Hotline: 19008089 - Email: support@hcshop.com</p>
        <p>Website: www.hcshop.com</p>
      </div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
      <div class="invoice-sub-title">SALES INVOICE</div>
      <div class="meta-row">
        <span class="meta-label">Mã đơn hàng:</span>
        <span class="meta-value highlight">${(order.order_id || '').substring(0, 8).toUpperCase()}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Ngày đặt:</span>
        <span class="meta-value">${formatDate(orderDate)}</span>
      </div>
      <div class="meta-row">
        <span class="meta-label">Trạng thái:</span>
        <span class="meta-value ${statusClass}">${statusText}</span>
      </div>
    </div>
  </div>

  <hr class="divider-double" />

  <div class="invoice-info-section">
    <div class="info-block">
      <h3 class="section-title">Thông tin khách hàng</h3>
      <div class="info-row"><span class="info-label">Khách hàng:</span><span class="info-value"><strong>${order.shipping?.name || ''}</strong></span></div>
      <div class="info-row"><span class="info-label">Điện thoại:</span><span class="info-value">${order.shipping?.phone || ''}</span></div>
      <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${order.shipping?.email || ''}</span></div>
      <div class="info-row"><span class="info-label">Địa chỉ:</span><span class="info-value">${order.shipping?.address || ''}</span></div>
    </div>
    <div class="info-block border-left">
      <h3 class="section-title">Thông tin giao nhận</h3>
      <div class="info-row"><span class="info-label">Phương thức:</span><span class="info-value">${order.shipping?.shipmethod || 'Giao hàng tận nơi'}</span></div>
      <div class="info-row"><span class="info-label">Dịch vụ vận chuyển:</span><span class="info-value">Standard Delivery</span></div>
      <div class="info-row"><span class="info-label">Thanh toán:</span><span class="info-value">${order.paymentmethod?.toUpperCase() || ''}</span></div>
      <div class="info-row"><span class="info-label">Ghi chú:</span><span class="info-value"><em>${order.shipping?.note || 'Không có ghi chú.'}</em></span></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 5%">STT</th>
        <th style="width: 45%">Tên Sản Phẩm / Thuộc tính</th>
        <th style="width: 10%">SL</th>
        <th style="width: 15%">Đơn Giá</th>
        <th style="width: 15%">Thành Tiền</th>
        <th style="width: 10%">Bảo Hành</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
    </tbody>
  </table>

  <div class="invoice-summary-section">
    <div class="payment-note">
      <p class="note-title">Cam kết & Chính sách đổi trả:</p>
      <ul>
        <li>Được kiểm tra hàng trước khi nhận và thanh toán.</li>
        <li>Hỗ trợ đổi trả sản phẩm trong vòng 7 ngày nếu lỗi sản xuất.</li>
        <li>Giữ lại hóa đơn để được bảo hành sản phẩm chính hãng.</li>
      </ul>
    </div>
    <div class="totals-block">
      <div class="totals-row">
        <span class="totals-label">Tạm tính:</span>
        <span class="totals-value">${totalBeforeDiscount.toLocaleString('vi-VN')}₫</span>
      </div>
      ${discountAmount > 0 ? `
      <div class="totals-row">
        <span class="totals-label">Giảm giá voucher:</span>
        <span class="totals-value">-${discountAmount.toLocaleString('vi-VN')}₫</span>
      </div>
      ` : ''}
      <div class="totals-row grand-total">
        <span class="totals-label">TỔNG THANH TOÁN:</span>
        <span class="totals-value">${total.toLocaleString('vi-VN')}₫</span>
      </div>
    </div>
  </div>

  <div class="invoice-signatures">
    <div class="signature-box">
      <p class="signature-title">Người mua hàng</p>
      <p class="signature-note">(Ký, ghi rõ họ tên)</p>
      <div class="signature-space"></div>
      <p class="signature-name">${order.shipping?.name || ''}</p>
    </div>
    <div class="signature-box">
      <p class="signature-title">Người lập hóa đơn</p>
      <p class="signature-note">(Ký, đóng dấu đại diện)</p>
      <div class="signature-space"></div>
      <p class="signature-name">Bộ phận bán hàng</p>
    </div>
  </div>

  <div class="invoice-footer">
    <p class="thank-you">CẢM ƠN QUÝ KHÁCH ĐÃ MUA SẮM TẠI HCSHOP!</p>
    <p class="footer-tagline">Hẹn gặp lại quý khách lần sau.</p>
  </div>
</body>
</html>`;
};

/* ──────────────────────────────────────────────
   Main Component
────────────────────────────────────────────── */
const OrderPrintModal = ({ order, onClose }) => {
  const printRef = useRef();

  /* ── Lấy logo từ bảng GeneralImages (image_name = 'Logo') ── */
  const { data: generalImagesData } = useGetGeneralImagesQuery({ search: 'Logo', limit: 5 });
  const logoRecord = generalImagesData?.data?.find(
    (img) => img.image_name?.toLowerCase() === 'logo'
  );
  const logoUrl = logoRecord?.image?.[0] || fallbackLogo;

  if (!order) return null;

  const orderDate = order.createdAt ? dayjs(order.createdAt).utc() : null;
  const totalBeforeDiscount = (order.items || []).reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1), 0
  );
  const discountAmount = order.discount_amount || 0;
  const total = order.total || 0;

  const statusText = order.status === 'Cancelled' ? 'Đã hủy đơn hàng' :
    order.paymentmethod === 'cod' ? 'Chưa thanh toán' :
      order.status === 'Succeeded' ? 'Đã thanh toán' :
        order.status === 'Pending' ? 'Đang chờ duyệt' :
          order.status === 'Processing' ? 'Đang xử lý' : order.status;

  const statusClass = order.status === 'Cancelled' ? 'status-cancelled' :
    order.paymentmethod === 'cod' ? 'status-pending' :
      order.status === 'Succeeded' ? 'status-succeeded' :
        order.status?.toLowerCase() || 'status-pending';

  /* Convert logo to base64, then open a Blob URL window for printing */
  const openPrintWindow = async (autoClose = false) => {
    const logoBase64 = await toBase64(logoUrl);
    const printData = {
      order, orderDate, totalBeforeDiscount, discountAmount, total,
      logoSrc: logoBase64,
    };
    const html = buildPrintHTML(printData);

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);

    const win = window.open(blobUrl, '_blank', 'width=900,height=700');
    win.addEventListener('load', () => {
      win.focus();
      win.print();
      if (autoClose) {
        win.addEventListener('afterprint', () => {
          win.close();
          URL.revokeObjectURL(blobUrl);
        });
      } else {
        setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
      }
    });
  };

  const handlePrint = () => openPrintWindow(false);
  const handleDownloadPDF = () => openPrintWindow(true);

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* ── Top action bar ── */}
        <div className="print-modal-actions-top">
          <span className="print-modal-title">Xem trước hóa đơn bán hàng</span>
          <div className="print-modal-btn-group">
            <button className="btn-print" onClick={handlePrint}>
              In hóa đơn
            </button>
            <button className="btn-download-pdf" onClick={handleDownloadPDF}>
              Tải PDF
            </button>
            <button className="btn-cancel-print" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>

        {/* ── Invoice Preview ── */}
        <div className="print-preview-wrapper">
          <div className="invoice-paper" ref={printRef}>

            {/* Header */}
            <div className="invoice-header">
              <div className="company-info">
                <img src={logoUrl} alt="Logo" className="logo-img-preview" />
                <p className="company-tagline">Chuyên thiết bị và phụ kiện thể thao chính hãng</p>
                <div className="company-details">
                  <p>Địa chỉ: 67/7 Trương Định, KV Vĩnh Phú, P An Nhơn Bắc, Gia Lai</p>
                  <p>Hotline: 19008089 - Email: support@hcshop.com</p>
                  <p>Website: www.hcshop.com</p>
                </div>
              </div>
              <div className="invoice-meta">
                <div className="invoice-title">HÓA ĐƠN BÁN HÀNG</div>
                <div className="invoice-sub-title">SALES INVOICE</div>
                <div className="meta-row">
                  <span className="meta-label">Mã đơn hàng:</span>
                  <span className="meta-value highlight">{order.order_id?.substring(0, 8).toUpperCase()}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Ngày đặt:</span>
                  <span className="meta-value">{orderDate ? orderDate.format('HH:mm DD/MM/YYYY') : '---'}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Trạng thái:</span>
                  <span className={`meta-value ${statusClass}`}>{statusText}</span>
                </div>
              </div>
            </div>

            <hr className="divider-double" />

            {/* Customer Info */}
            <div className="invoice-info-section">
              <div className="info-block">
                <h3 className="section-title">Thông tin khách hàng</h3>
                <div className="info-row">
                  <span className="info-label">Khách hàng:</span>
                  <span className="info-value"><strong>{order.shipping?.name || ''}</strong></span>
                </div>
                <div className="info-row">
                  <span className="info-label">Điện thoại:</span>
                  <span className="info-value">{order.shipping?.phone || ''}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{order.shipping?.email || ''}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Địa chỉ:</span>
                  <span className="info-value">{order.shipping?.address || ''}</span>
                </div>
              </div>

              <div className="info-block border-left">
                <h3 className="section-title">Thông tin giao nhận</h3>
                <div className="info-row">
                  <span className="info-label">Phương thức:</span>
                  <span className="info-value">{order.shipping?.shipmethod || 'Giao hàng tận nơi'}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Dịch vụ vận chuyển:</span>
                  <span className="info-value">Standard Delivery</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Thanh toán:</span>
                  <span className="info-value">{order.paymentmethod?.toUpperCase() || ''}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Ghi chú:</span>
                  <span className="info-value"><em>{order.shipping?.note || 'Không có ghi chú.'}</em></span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '5%' }}>STT</th>
                  <th style={{ width: '45%' }}>Tên Sản Phẩm / Thuộc tính</th>
                  <th style={{ width: '10%' }} className="text-center">SL</th>
                  <th style={{ width: '15%' }} className="text-center">Đơn Giá</th>
                  <th style={{ width: '15%' }} className="text-center">Thành Tiền</th>
                  <th style={{ width: '10%' }} className="text-center">Bảo Hành</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, index) => {
                  const productName = item.product?.prod_name || item.product?.name || 'Sản phẩm';
                  const variantStr = item.selected_variants
                    ? Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(', ')
                    : '';
                  return (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="item-name"><strong>{productName}</strong></div>
                        {variantStr && (
                          <div className="item-variants">
                            <span className="variant-tag">{variantStr}</span>
                          </div>
                        )}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">
                        {(item.price || 0).toLocaleString('vi-VN')}₫
                      </td>
                      <td className="text-center">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}₫
                      </td>
                      <td className="text-center">{item.product?.warranty || 'Không bảo hành'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Note + Totals */}
            <div className="invoice-summary-section">
              <div className="payment-note">
                <p className="note-title">Cam kết & Chính sách đổi trả:</p>
                <ul>
                  <li>Được kiểm tra hàng trước khi nhận và thanh toán.</li>
                  <li>Hỗ trợ đổi trả sản phẩm trong vòng 7 ngày nếu lỗi sản xuất.</li>
                  <li>Giữ lại hóa đơn để được bảo hành sản phẩm chính hãng.</li>
                </ul>
              </div>
              <div className="totals-block">
                <div className="totals-row">
                  <span className="totals-label">Tạm tính:</span>
                  <span className="totals-value">{totalBeforeDiscount.toLocaleString('vi-VN')}₫</span>
                </div>
                {discountAmount > 0 && (
                  <div className="totals-row">
                    <span className="totals-label">Giảm giá voucher:</span>
                    <span className="totals-value">-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="totals-row grand-total">
                  <span className="totals-label">TỔNG THANH TOÁN:</span>
                  <span className="totals-value">{total.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>

            {/* Signatures */}
            <div className="invoice-signatures">
              <div className="signature-box">
                <p className="signature-title">Người mua hàng</p>
                <p className="signature-note">(Ký, ghi rõ họ tên)</p>
                <div className="signature-space"></div>
                <p className="signature-name">{order.shipping?.name || ''}</p>
              </div>
              <div className="signature-box">
                <p className="signature-title">Người lập hóa đơn</p>
                <p className="signature-note">(Ký, đóng dấu đại diện)</p>
                <div className="signature-space"></div>
                <p className="signature-name">Bộ phận bán hàng</p>
              </div>
            </div>

            {/* Footer */}
            <div className="invoice-footer">
              <p className="thank-you">CẢM ƠN QUÝ KHÁCH ĐÃ MUA SẮM TẠI HCSHOP!</p>
              <p className="footer-tagline">Hẹn gặp lại quý khách lần sau.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPrintModal;
