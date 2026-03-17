import {useRef,React} from 'react';
import {
  faDollarSign,
  faBoxOpen,
  faCalendarAlt,
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
import { useGetStatisticsQuery } from '../../../features/statistics/statisticsApi';
import dayjs from 'dayjs';

const AdminStatistics = () => {
  const endDate = dayjs().add(1, 'day').format('YYYY-MM-DD');
  const startDate = dayjs().subtract(365, 'day').format('YYYY-MM-DD');

  const { data, isLoading, isError } = useGetStatisticsQuery({ startDate, endDate });

  if (isLoading) return <p>Đang tải dữ liệu thống kê...</p>;
  if (isError) return <p>Lỗi khi tải thống kê.</p>;

  const { today, chartData } = data;

  const StatCard = ({ title, value, change, icon, isDown = false }) => (
    <div className="stat-card">
      <div className="stat-left">
        <div className="stat-title">{title}</div>
        <div className="stat-value">{value.toLocaleString()}</div>
        <div className={`stat-change ${isDown ? "down" : "up"}`}>
          {isDown ? "▼" : "▲"} {Math.abs(change)}% so với hôm qua
        </div>
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

  return (
    <div className="dashboard-container">
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
    </div>
  );
};

export default AdminStatistics;
