import React, { useState, useEffect } from 'react';
import './LoginAnalytics.css';

const LoginAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [dateStats, setDateStats] = useState({});
  const [peakTimes, setPeakTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, usersRes, dateRes, peakRes] = await Promise.all([
        fetch(`${API_BASE}/analytics/login/summary`),
        fetch(`${API_BASE}/analytics/login/users`),
        fetch(`${API_BASE}/analytics/login/by-date`),
        fetch(`${API_BASE}/analytics/login/peak-times`)
      ]);

      if (!summaryRes.ok) throw new Error('Failed to fetch summary');
      
      const summaryData = await summaryRes.json();
      setSummary(summaryData.data);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserStats(usersData.data.users);
      }

      if (dateRes.ok) {
        const dateData = await dateRes.json();
        setDateStats(dateData.data);
      }

      if (peakRes.ok) {
        const peakData = await peakRes.json();
        setPeakTimes(peakData.data.peakLoginTimes);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="analytics-container"><div className="loader">Đang tải dữ liệu...</div></div>;
  }

  return (
    <div className="analytics-container">
      <h1>📊 Phân Tích Đăng Nhập Hệ Thống</h1>
      
      {error && <div className="error-message">{error}</div>}

      {/* Summary Cards */}
      {summary && (
        <div className="summary-cards">
          <div className="card">
            <h3>Tổng Lượt Đăng Nhập</h3>
            <p className="big-number">{summary.totalLogins}</p>
          </div>
          <div className="card">
            <h3>Số Người Dùng Độc Lập</h3>
            <p className="big-number">{summary.uniqueUsers}</p>
          </div>
          <div className="card">
            <h3>Trung Bình Đăng Nhập/Người Dùng</h3>
            <p className="big-number">{summary.averageLoginsPerUser}</p>
          </div>
          <div className="card">
            <h3>Cập Nhật Lúc</h3>
            <p className="small-text">{new Date(summary.reportGeneratedAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Tóm Tắt
        </button>
        <button 
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Người Dùng
        </button>
        <button 
          className={`tab-btn ${activeTab === 'dates' ? 'active' : ''}`}
          onClick={() => setActiveTab('dates')}
        >
          Theo Ngày
        </button>
        <button 
          className={`tab-btn ${activeTab === 'peak' ? 'active' : ''}`}
          onClick={() => setActiveTab('peak')}
        >
          Giờ Cao Điểm
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && peakTimes.length > 0 && (
          <div className="section">
            <h2>⏰ Giờ Đăng Nhập Cao Điểm</h2>
            <div className="chart-container">
              <div className="bar-chart">
                {peakTimes.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="bar-item">
                    <div className="bar-label">{item.hour}</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar" 
                        style={{
                          width: `${(item.count / Math.max(...peakTimes.map(t => t.count))) * 100}%`
                        }}
                      >
                        <span className="bar-value">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && userStats.length > 0 && (
          <div className="section">
            <h2>👥 Thống Kê Đăng Nhập Theo Người Dùng</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Số Lần Đăng Nhập</th>
                    <th>Lần Đầu</th>
                    <th>Lần Cuối</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((user, idx) => (
                    <tr key={idx}>
                      <td>{user.email}</td>
                      <td><span className="badge">{user.count}</span></td>
                      <td>{new Date(user.firstLogin).toLocaleString('vi-VN')}</td>
                      <td>{new Date(user.lastLogin).toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Dates Tab */}
        {activeTab === 'dates' && Object.keys(dateStats).length > 0 && (
          <div className="section">
            <h2>📅 Thống Kê Đăng Nhập Theo Ngày</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ngày</th>
                    <th>Tổng Lượt Đăng Nhập</th>
                    <th>Số Người Dùng Độc Lập</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.values(dateStats).reverse().map((day, idx) => (
                    <tr key={idx}>
                      <td>{day.date}</td>
                      <td><span className="badge badge-primary">{day.totalLogins}</span></td>
                      <td><span className="badge badge-success">{day.uniqueUserCount}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Peak Times Tab */}
        {activeTab === 'peak' && peakTimes.length > 0 && (
          <div className="section">
            <h2>🔥 Các Giờ Cao Điểm Đăng Nhập</h2>
            <div className="chart-container">
              <div className="bar-chart">
                {peakTimes.map((item, idx) => (
                  <div key={idx} className="bar-item">
                    <div className="bar-label">{item.hour}</div>
                    <div className="bar-wrapper">
                      <div 
                        className="bar bar-primary"
                        style={{
                          width: `${(item.count / Math.max(...peakTimes.map(t => t.count))) * 100}%`
                        }}
                      >
                        <span className="bar-value">{item.count}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="refresh-button">
        <button onClick={fetchAllData} className="btn-refresh">
          🔄 Làm Mới Dữ Liệu
        </button>
      </div>
    </div>
  );
};

export default LoginAnalytics;
