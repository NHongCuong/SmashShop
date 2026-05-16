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
   We embed the logo as the same src the browser
   already loaded (works because same origin).
────────────────────────────────────────────── */
const buildPrintHTML = ({ order, orderDate, totalBeforeDiscount, discountAmount, total, logoSrc }) => {
  const dd = orderDate ? orderDate.format('DD') : '....';
  const mm = orderDate ? orderDate.format('MM') : '....';
  const yyyy = orderDate ? orderDate.format('YYYY') : '......';

  const itemRows = (order.items || []).map((item, index) => {
    const productName = item.product?.prod_name || item.product?.name || 'Sản phẩm';
    const variantStr = item.selected_variants
      ? Object.entries(item.selected_variants).map(([k, v]) => `${k}: ${v}`).join(', ')
      : '';
    const lineTotal = ((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN');
    const unitPrice = (item.price || 0).toLocaleString('vi-VN');
    const discountCell = discountAmount > 0 && index === 0
      ? `-${discountAmount.toLocaleString('vi-VN')}₫` : '';
    return `
      <tr>
        <td class="tc">${index + 1}</td>
        <td>${productName}${variantStr ? ` <span class="vs">(${variantStr})</span>` : ''}</td>
        <td class="tc">${item.quantity}</td>
        <td class="tc">${discountCell}</td>
        <td class="tr">${unitPrice}₫</td>
        <td class="tr">${lineTotal}₫</td>
        <td></td>
      </tr>`;
  }).join('');

  const emptyCount = Math.max(0, 5 - (order.items || []).length);
  const emptyRows = Array.from({ length: emptyCount })
    .map(() => `<tr class="er"><td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`)
    .join('');

  const discountRows = discountAmount > 0 ? `
    <div class="tot-row"><span>Tạm tính:</span><span>${totalBeforeDiscount.toLocaleString('vi-VN')}₫</span></div>
    <div class="tot-row"><span>Giảm giá (${order.voucher_id?.voucher_name || 'Voucher'}):</span><span>-${discountAmount.toLocaleString('vi-VN')}₫</span></div>
  ` : '';

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
        font-family: Arial, sans-serif;
        font-size: 11px;
        color: #777;
      }
    }
    @media print {
      html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      body { padding: 5mm; }
    }
    body { font-family: Arial, sans-serif; font-size: 12px; color: #111; padding: 0; }
    /* ── header ── */
    .hdr { display: flex; align-items: flex-start; gap: 12px; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 12px; }
    .hdr img { width: 90px; height: auto; }
    .store { flex: 1; text-align: center; }
    .store h2 { font-size: 16px; font-weight: 800; text-transform: uppercase; margin-bottom: 4px; }
    .store p { font-size: 11px; margin: 2px 0; }
    .meta-box { border: 1px solid #333; padding: 6px 10px; font-size: 11px; min-width: 155px; }
    .meta-title { font-weight: 800; text-align: center; font-size: 12px; border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 4px; }
    .meta-row { display: flex; justify-content: space-between; gap: 8px; margin-top: 3px; }
    .meta-row span:first-child { font-weight: 600; white-space: nowrap; }
    /* ── customer ── */
    .cust { border: 1px solid #aaa; padding: 8px 12px; background: #fafafa; margin-bottom: 12px; }
    .cust-row { display: flex; gap: 8px; margin: 3px 0; }
    .cust-row .lbl { font-weight: 700; min-width: 160px; }
    /* ── table ── */
    table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 12px; page-break-inside: auto; }
    th, td { border: 1px solid #333; padding: 4px 6px; }
    thead { display: table-header-group; counter-increment: page; } /* Increment on every page break where thead repeats */
    thead th { background: #e8e8e8; font-weight: 700; text-align: center; }
    tr { page-break-inside: avoid; page-break-after: auto; }
    .tc { text-align: center; }
    .tr { text-align: right; }
    .er td { height: 24px; }
    .vs { font-size: 10px; color: #555; font-style: italic; }
    /* ── footer ── */
    .foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; margin-bottom: 10px; page-break-inside: avoid; }
    .note { flex: 1; border: 1px solid #ccc; padding: 6px 10px; min-height: 38px; font-size: 12px; }
    .note .lbl { font-weight: 700; }
    .totals { min-width: 240px; }
    .tot-row { display: flex; justify-content: space-between; gap: 10px; font-size: 12px; padding: 2px 0; border-bottom: 1px dashed #ccc; }
    .tot-final { font-weight: 800; font-size: 14px; border-bottom: 2px solid #333; border-top: 1px solid #333; margin-top: 4px; padding-top: 4px; }
    /* ── date + signature ── */
    .date-line { text-align: right; font-size: 12px; font-style: italic; color: #444; margin-bottom: 32px; page-break-inside: avoid; }
    .sig { display: flex; justify-content: space-between; margin-top: 4px; page-break-inside: avoid; }
    .sig-col { text-align: center; width: 45%; }
    .sig-col .sig-title { font-weight: 700; font-size: 12px; margin-bottom: 4px; }
    .sig-col .sig-sub { font-size: 11px; font-style: italic; color: #555; margin-bottom: 56px; }
    .sig-col .sig-line { border-top: 1px solid #333; width: 70%; margin: 0 auto; }
  </style>
</head>
<body>
  <!-- Header -->
  <div class="hdr">
    <img src="${logoSrc}" alt="HC Shop Logo"/>
    <div class="store">
      <h2>CỬA HÀNG HC SHOP</h2>
      <p>Địa chỉ: 67/7 Trương Định, KV Vĩnh Phú, P An Nhơn Bắc, Gia Lai</p>
      <p>Website: hcshop.com</p>
    </div>
    <div class="meta-box">
      <div class="meta-title">MÃ HÓA ĐƠN</div>
      <div class="meta-row"><span>Mã đơn:</span><span>${(order.order_id || '').substring(0, 8).toUpperCase()}</span></div>
      <div class="meta-row"><span>Ngày:</span><span>${orderDate ? orderDate.format('DD/MM/YYYY') : '---'}</span></div>
      <div class="meta-row"><span>Nhân viên:</span><span></span></div>
    </div>
  </div>

  <!-- Customer -->
  <div class="cust">
    <div class="cust-row"><span class="lbl">Khách hàng:</span><span>${order.shipping?.name || ''}</span></div>
    <div class="cust-row"><span class="lbl">Địa chỉ:</span><span>${order.shipping?.address || ''}</span></div>
    <div class="cust-row"><span class="lbl">Số điện thoại:</span><span>${order.shipping?.phone || ''}</span></div>
    <div class="cust-row"><span class="lbl">Email:</span><span>${order.shipping?.email || ''}</span></div>
    <div class="cust-row"><span class="lbl">Phương thức thanh toán:</span><span>${(order.paymentmethod || '').toUpperCase()}</span></div>
  </div>

  <!-- Items -->
  <table>
    <thead>
      <tr>
        <th style="width:36px">STT</th>
        <th>Tên sản phẩm</th>
        <th style="width:66px">Số lượng</th>
        <th style="width:78px">Giảm giá</th>
        <th style="width:96px">Đơn giá</th>
        <th style="width:106px">Thành tiền</th>
        <th style="width:74px">Bảo hành</th>
      </tr>
    </thead>
    <tbody>
      ${itemRows}
      ${emptyRows}
    </tbody>
  </table>

  <!-- Note + Totals -->
  <div class="foot">
    <div class="note">
      <span class="lbl">Ghi chú: </span>${order.shipping?.note || ''}
    </div>
    <div class="totals">
      ${discountRows}
      <div class="tot-row tot-final">
        <span>Tổng hóa đơn:</span>
        <span>${total.toLocaleString('vi-VN')}₫</span>
      </div>
    </div>
  </div>

  <!-- Date -->
  <div class="date-line">Ngày ${dd} Tháng ${mm} Năm ${yyyy}</div>

  <!-- Signatures -->
  <div class="sig">
    <div class="sig-col">
      <div class="sig-title">Khách hàng</div>
      <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
      <div class="sig-line"></div>
    </div>
    <div class="sig-col">
      <div class="sig-title">Nhân viên bán hàng</div>
      <div class="sig-sub">(Ký, ghi rõ họ tên)</div>
      <div class="sig-line"></div>
    </div>
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
  /* Hook phải gọi TRƯỚC early return để tuân thủ Rules of Hooks */
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

  /* Convert logo to base64, then open a Blob URL window for printing */
  const openPrintWindow = async (autoClose = false) => {
    const logoBase64 = await toBase64(logoUrl);   // base64 so it works in blob: context
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

  const dd = orderDate ? orderDate.format('DD') : '....';
  const mm = orderDate ? orderDate.format('MM') : '....';
  const yyyy = orderDate ? orderDate.format('YYYY') : '......';

  return (
    <div className="print-modal-overlay" onClick={onClose}>
      <div className="print-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* ── Top action bar ── */}
        <div className="print-modal-actions-top">
          <span className="print-modal-title">Xem trước hóa đơn</span>
          <div className="print-modal-btn-group">
            <button className="btn-print" onClick={handlePrint}>🖨️ In</button>
            <button className="btn-download-pdf" onClick={handleDownloadPDF}>📄 Tải PDF</button>
            <button className="btn-cancel-print" onClick={onClose}>✕ Hủy</button>
          </div>
        </div>

        {/* ── Invoice Preview ── */}
        <div className="print-preview-wrapper">
          <div className="invoice-paper" ref={printRef}>

            {/* Header */}
            <div className="invoice-header">
              <div className="invoice-logo-block">
                <img src={logoUrl} alt="HC Shop Logo" className="invoice-logo" />
              </div>
              <div className="invoice-store-info">
                <h2 className="invoice-store-name">CỬA HÀNG HC SHOP</h2>
                <p>Địa chỉ: 67/7 Trương Định, KV Vĩnh Phú, P An Nhơn Bắc, Gia Lai</p>
                <p>Website: hcshop.com</p>
              </div>
              <div className="invoice-meta">
                <div className="invoice-meta-box">
                  <div className="invoice-meta-title">MÃ HÓA ĐƠN</div>
                  <div className="invoice-meta-row">
                    <span>Mã đơn:</span>
                    <span>{order.order_id?.substring(0, 8).toUpperCase()}</span>
                  </div>
                  <div className="invoice-meta-row">
                    <span>Ngày:</span>
                    <span>{orderDate ? orderDate.format('DD/MM/YYYY') : '---'}</span>
                  </div>
                  <div className="invoice-meta-row">
                    <span>Nhân viên:</span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="invoice-customer">
              <div className="invoice-customer-row">
                <span className="label">Khách hàng:</span>
                <span>{order.shipping?.name || ''}</span>
              </div>
              <div className="invoice-customer-row">
                <span className="label">Địa chỉ:</span>
                <span>{order.shipping?.address || ''}</span>
              </div>
              <div className="invoice-customer-row">
                <span className="label">Số điện thoại:</span>
                <span>{order.shipping?.phone || ''}</span>
              </div>
              <div className="invoice-customer-row">
                <span className="label">Email:</span>
                <span>{order.shipping?.email || ''}</span>
              </div>
              <div className="invoice-customer-row">
                <span className="label">Phương thức thanh toán:</span>
                <span>{order.paymentmethod?.toUpperCase() || ''}</span>
              </div>
            </div>

            {/* Items Table */}
            <table className="invoice-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>STT</th>
                  <th>Tên sản phẩm</th>
                  <th style={{ width: '70px' }}>Số lượng</th>
                  <th style={{ width: '80px' }}>Giảm giá</th>
                  <th style={{ width: '100px' }}>Đơn giá</th>
                  <th style={{ width: '110px' }}>Thành tiền</th>
                  <th style={{ width: '80px' }}>Bảo hành</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, index) => {
                  const productName =
                    item.product?.prod_name || item.product?.name || 'Sản phẩm';
                  const variantStr = item.selected_variants
                    ? Object.entries(item.selected_variants)
                      .map(([k, v]) => `${k}: ${v}`)
                      .join(', ')
                    : '';
                  return (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        {productName}
                        {variantStr && (
                          <span className="variant-str"> ({variantStr})</span>
                        )}
                      </td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-center">
                        {discountAmount > 0 && index === 0
                          ? `-${discountAmount.toLocaleString('vi-VN')}₫`
                          : ''}
                      </td>
                      <td className="text-right">
                        {(item.price || 0).toLocaleString('vi-VN')}₫
                      </td>
                      <td className="text-right">
                        {((item.price || 0) * (item.quantity || 1)).toLocaleString('vi-VN')}₫
                      </td>
                      <td></td>
                    </tr>
                  );
                })}
                {/* Empty filler rows */}
                {(order.items || []).length < 5 &&
                  Array.from({ length: 5 - (order.items || []).length }).map((_, i) => (
                    <tr key={`empty-${i}`} className="empty-row">
                      <td>&nbsp;</td><td></td><td></td><td></td><td></td><td></td><td></td>
                    </tr>
                  ))}
              </tbody>
            </table>

            {/* Note + Totals */}
            <div className="invoice-footer-section">
              <div className="invoice-note">
                <span className="label">Ghi chú: </span>
                <span>{order.shipping?.note || ''}</span>
              </div>
              <div className="invoice-totals">
                {discountAmount > 0 && (
                  <div className="invoice-total-row">
                    <span>Tạm tính:</span>
                    <span>{totalBeforeDiscount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="invoice-total-row">
                    <span>Giảm giá ({order.voucher_id?.voucher_name || 'Voucher'}):</span>
                    <span>-{discountAmount.toLocaleString('vi-VN')}₫</span>
                  </div>
                )}
                <div className="invoice-total-row total-final">
                  <span>Tổng hóa đơn:</span>
                  <span>{total.toLocaleString('vi-VN')}₫</span>
                </div>
              </div>
            </div>

            {/* Date line */}
            <div className="invoice-signature-date">
              Ngày {dd} Tháng {mm} Năm {yyyy}
            </div>

            {/* Signatures */}
            <div className="invoice-sig-row">
              <div className="invoice-sig-col">
                <div className="sig-title">Khách hàng</div>
                <div className="sig-sub">(Ký, ghi rõ họ tên)</div>
                <div className="sig-spacer"></div>
                <div className="sig-line"></div>
              </div>
              <div className="invoice-sig-col">
                <div className="sig-title">Nhân viên bán hàng</div>
                <div className="sig-sub">(Ký, ghi rõ họ tên)</div>
                <div className="sig-spacer"></div>
                <div className="sig-line"></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPrintModal;
