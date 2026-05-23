import { React, useState } from 'react';
import {
  faDollarSign,
  faBoxOpen,
  faCalendarAlt,
  faWarehouse,
  faTriangleExclamation,
  faUsers,
  faPercentage,
  faCreditCard,
  faEye,
  faGlobe
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./AdminStatistics.css";
import { useGetStatisticsQuery, useSendReportMutation, useGetReportStatusQuery, useToggleReportCronMutation } from '../../../features/statistics/statisticsApi';
import { useGetLowStockAlertsQuery } from '../../../features/services/stockApi';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

const AdminStatistics = () => {
  const navigate = useNavigate();
  const endDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const startDate = dayjs().subtract(365, 'day').format('YYYY-MM-DD');

  const { data, isLoading, isError } = useGetStatisticsQuery({ startDate, endDate });
  const { data: stockAlerts } = useGetLowStockAlertsQuery();

  // Report hooks
  const [sendReport, { isLoading: isSending }] = useSendReportMutation();
  const { data: reportStatusData } = useGetReportStatusQuery();
  const [toggleReportCron] = useToggleReportCronMutation();

  const [reportMsg, setReportMsg] = useState('');
  const [reportMsgType, setReportMsgType] = useState(''); // 'success' or 'error'

  const reportStatus = reportStatusData?.status;

  const handleSendReport = async () => {
    setReportMsg('');
    try {
      const res = await sendReport().unwrap();
      setReportMsg(res.message || 'Đã gửi báo cáo thành công!');
      setReportMsgType('success');
    } catch (err) {
      setReportMsg(err?.data?.message || 'Lỗi khi gửi báo cáo.');
      setReportMsgType('error');
    }
    setTimeout(() => setReportMsg(''), 6000);
  };

  const handleToggleCron = async () => {
    const newActive = !reportStatus?.isActive;
    try {
      await toggleReportCron(newActive).unwrap();
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  if (isLoading) return <p className="loading-stats">Đang tải dữ liệu thống kê...</p>;
  if (isError || !data) return <p className="error-stats">Lỗi khi tải thống kê.</p>;

  const { today, chartData, totalOverall, productPerformance, allProductsRevenue, lowConversionProducts, conversionRate } = data;

  const StatCard = ({ title, value, change, icon, isDown = false, showChange = true }) => (
    <div className="stat-card">
      <div className="stat-left">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value.toLocaleString()}</div>
        {showChange && (
          <div className={`stat-change ${isDown ? "down" : "up"}`}>
            {isDown ? "▼" : "▲"} {Math.abs(change)}% so với hôm qua
          </div>
        )}
      </div>
      <div className="stat-icon">
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  );

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div style={{ backgroundColor: "#fff", border: "1px solid #ccc", padding: 10 }}>
          <p><strong>Ngày:</strong> {label}</p>
          <p><strong>Doanh thu:</strong> {dataPoint.revenue.toLocaleString()} đ</p>
          <p><strong>Đơn hàng:</strong> {dataPoint.orders}</p>
          <p><strong>Sản phẩm đã bán:</strong> {dataPoint.sold}</p>
        </div>
      );
    }
    return null;
  };

  const CustomProductTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const p = payload[0].payload;
      return (
        <div className="custom-tooltip" style={{ backgroundColor: "#fff", border: "2px solid #4e73df", padding: "10px", borderRadius: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
          <p style={{ margin: "0 0 8px 0", fontWeight: "bold", color: "#333", borderBottom: "1px solid #eee", paddingBottom: "5px" }}>{p.name}</p>
          <p style={{ margin: "4px 0", color: "#1cc88a" }}><strong>Hôm nay:</strong> {p.todayRevenue.toLocaleString()} ₫</p>
          <p style={{ margin: "4px 0", color: "#36b9cc" }}><strong>Tháng này:</strong> {p.monthRevenue.toLocaleString()} ₫</p>
          <p style={{ margin: "4px 0", color: "#4e73df" }}><strong>365 ngày qua:</strong> {p.yearRevenue.toLocaleString()} ₫</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dashboard-container">
      {/* Email Report Section */}
      <div className="report-section">
        <div className="report-header">
          <div className="report-header-left">
            <span className="report-icon">📧</span>
            <div>
              <h3 className="report-title">Báo cáo Dashboard qua Email</h3>
              <p className="report-desc">Tự động gửi báo cáo tổng quan mỗi ngày lúc 11:30 AM</p>
            </div>
          </div>
          <div className="report-header-right">
            <label className="report-toggle-switch" title={reportStatus?.isActive ? 'Tắt cron job' : 'Bật cron job'}>
              <input 
                type="checkbox" 
                checked={reportStatus?.isActive || false}
                onChange={handleToggleCron}
              />
              <span className="report-toggle-slider"></span>
            </label>
          </div>
        </div>

        <div className="report-body">
          <div className="report-info-grid">
            <div className="report-info-item">
              <span className="report-info-label">Trạng thái</span>
              <span className={`report-info-value report-status-badge ${reportStatus?.isActive ? 'active' : 'inactive'}`}>
                {reportStatus?.isActive ? '🟢 Đang hoạt động' : '🔴 Đã tắt'}
              </span>
            </div>
            <div className="report-info-item">
              <span className="report-info-label">Lịch gửi</span>
              <span className="report-info-value">
                ⏰ {reportStatus?.nextRun || 'Mỗi ngày lúc 11:30 AM (GMT+7)'}
              </span>
            </div>
            <div className="report-info-item">
              <span className="report-info-label">Lần gửi cuối</span>
              <span className="report-info-value">
                📅 {reportStatus?.lastRun ? dayjs(reportStatus.lastRun).format('DD/MM/YYYY HH:mm:ss') : 'Chưa gửi lần nào'}
              </span>
            </div>
            <div className="report-info-item">
              <span className="report-info-label">Kết quả</span>
              <span className="report-info-value">
                {reportStatus?.lastResult || 'N/A'}
              </span>
            </div>
          </div>

          {reportStatus?.recipientEmails?.length > 0 && (
            <div className="report-recipients">
              <span className="report-info-label">Người nhận:</span>
              <div className="report-email-tags">
                {reportStatus.recipientEmails.map((email, i) => (
                  <span key={i} className="report-email-tag">📩 {email}</span>
                ))}
              </div>
            </div>
          )}

          <div className="report-actions">
            <button 
              className="report-send-btn"
              onClick={handleSendReport}
              disabled={isSending}
            >
              {isSending ? (
                <>
                  <span className="report-spinner"></span> Đang gửi...
                </>
              ) : (
                <>📤 Gửi báo cáo ngay</>
              )}
            </button>
          </div>

          {reportMsg && (
            <div className={`report-msg ${reportMsgType}`}>
              {reportMsgType === 'success' ? '✅' : '❌'} {reportMsg}
            </div>
          )}
        </div>
      </div>

      <h2>Thống kê tổng quan</h2>
      <div className="stat-cards" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', display: 'grid' }}>
        <StatCard title="Tổng Doanh thu" value={totalOverall?.revenue || 0} icon={faDollarSign} showChange={false} />
        <StatCard title="Tổng Đơn hàng" value={totalOverall?.orders || 0} icon={faCalendarAlt} showChange={false} />
        <StatCard title="Tổng Sản phẩm đã bán" value={totalOverall?.sold || 0} icon={faBoxOpen} showChange={false} />
        <StatCard title="Tổng Khách hàng" value={totalOverall?.customers || 0} icon={faUsers} showChange={false} />
        <StatCard title="Gía trị đơn TB (AOV)" value={Math.round(totalOverall?.aov || 0)} icon={faCreditCard} showChange={false} />
        <StatCard title="Tỷ lệ chuyển đổi" value={`${conversionRate || 0}%`} icon={faPercentage} showChange={false} />
        <StatCard title="Tổng lượt truy cập" value={totalOverall?.visits || 0} icon={faGlobe} showChange={false} />
        
        <div className="stat-card alert-card" onClick={() => navigate('/admin/stock')} style={{ cursor: 'pointer', background: (stockAlerts?.count > 0 ? '#fff3e0' : '#e8f5e9') }}>
          <div className="stat-left">
            <div className="stat-title">Sắp hết hàng</div>
            <div className="stat-value" style={{ color: stockAlerts?.count > 0 ? '#e65100' : '#1b5e20' }}>
              {stockAlerts?.count || 0}
            </div>
          </div>
          <div className="stat-icon" style={{ color: stockAlerts?.count > 0 ? '#e65100' : '#1b5e20' }}>
            <FontAwesomeIcon icon={stockAlerts?.count > 0 ? faTriangleExclamation : faWarehouse} />
          </div>
        </div>
      </div>

      <h2>Thống kê ngày hôm nay</h2>
      <div className="stat-cards">
        <StatCard title="Doanh thu" value={today.revenue} change={today.change.revenue} icon={faDollarSign} />
        <StatCard title="Đơn hàng" value={today.orders} change={today.change.orders} icon={faCalendarAlt} />
        <StatCard title="Sản phẩm đã bán" value={today.sold} change={today.change.sold} icon={faBoxOpen} isDown={today.change.sold < 0} />
      </div>

      <h3>Thống kê doanh thu theo 365 ngày qua</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={[0, 'dataMax + 1000000']}
            tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}tr` : value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>

      <h3 style={{ marginTop: '40px', marginBottom: '20px' }}>Hiệu suất doanh thu tất cả sản phẩm</h3>
      <div className="all-products-chart-container" style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', marginBottom: '30px' }}>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={allProductsRevenue} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="name" 
              angle={-45} 
              textAnchor="end" 
              interval={0} 
              tick={{ fontSize: 10 }}
              height={80}
            />
            <YAxis tickFormatter={(val) => (val >= 1000000 ? `${val/1000000}tr` : val.toLocaleString())} />
            <Tooltip content={<CustomProductTooltip />} />
            <Bar dataKey="yearRevenue" fill="#1cc88a" name="Doanh thu năm" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, bottom: 5, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis
            domain={[0, 'dataMax + 1000000']}
            tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}tr` : value.toLocaleString()}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="revenue" fill="#00C49F" />
        </BarChart>
      </ResponsiveContainer>

      <div className="performance-sections" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        <div className="performance-card">
          <h3>Top 10 Sản phẩm bán chạy (Doanh thu)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={productPerformance} layout="vertical" margin={{ left: 50, right: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value) => value.toLocaleString() + ' ₫'} />
              <Bar dataKey="revenue" fill="#4e73df" name="Doanh thu" radius={[0, 5, 5, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="performance-card">
          <h3>Sản phẩm "Xem nhiều nhưng bán ít"</h3>
          <div className="low-conversion-list" style={{ background: '#fff', padding: '15px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '2px solid #eee' }}>
                  <th style={{ padding: '8px' }}>Tên sản phẩm</th>
                  <th style={{ padding: '8px' }}>Lượt xem</th>
                  <th style={{ padding: '8px' }}>Đã bán</th>
                </tr>
              </thead>
              <tbody>
                {lowConversionProducts?.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f9f9f9' }}>
                    <td style={{ padding: '8px' }}>{p.prod_name}</td>
                    <td style={{ padding: '8px', color: '#e74c3c', fontWeight: 'bold' }}>
                      <FontAwesomeIcon icon={faEye} style={{ marginRight: '5px' }} />
                      {p.views || 0}
                    </td>
                    <td style={{ padding: '8px' }}>{p.quantity_sold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

  );
};

export default AdminStatistics;
