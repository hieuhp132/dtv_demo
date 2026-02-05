import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './LoginAnalytics.css';
import { API_BASE } from '../../../services/api';
const LoginAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [dateStats, setDateStats] = useState({});
  const [peakTimes, setPeakTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState(null);

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
    return (
      <div className="analytics-container">
        <div className="loader">Loading analytics data...</div>
      </div>
    );
  }

  return (
    <div className="analytics-container">
      <h1>📊 System Login Analytics</h1>

      {error && <div className="error-message">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          Users
        </button>
        <button
          className={`tab-btn ${activeTab === 'dates' ? 'active' : ''}`}
          onClick={() => setActiveTab('dates')}
        >
          By Date
        </button>
        <button
          className={`tab-btn ${activeTab === 'peak' ? 'active' : ''}`}
          onClick={() => setActiveTab('peak')}
        >
          Peak Hours
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="section">
            <h2>📊 System Overview</h2>
            {/* Quick Stats */}
            <div className="quick-stats">
              <div className="stat-box">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <div className="stat-label">Total Activity</div>
                  <div className="stat-value">{summary?.totalLogins || 0}</div>
                  <div className="stat-detail">Logins this period</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-label">Active Users</div>
                  <div className="stat-value">{summary?.uniqueUsers || 0}</div>
                  <div className="stat-detail">Unique visitors</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <div className="stat-label">Avg per User</div>
                  <div className="stat-value">{(parseFloat(summary?.averageLoginsPerUser) || 0).toFixed(1)}</div>
                  <div className="stat-detail">Logins per person</div>
                </div>
              </div>
              
              <div className="stat-box">
                <div className="stat-icon">⏰</div>
                <div className="stat-info">
                  <div className="stat-label">Last Updated</div>
                  <div className="stat-value">
                    {summary?.reportGeneratedAt 
                      ? new Date(summary.reportGeneratedAt).toLocaleDateString() 
                      : 'N/A'}
                  </div>
                  <div className="stat-detail">Report time</div>
                </div>
              </div>
            </div>
                            {/* Peak Summary Stats */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>Summary</h3>
                  <div className="stats-grid">
                    <div className="stat-detail-box">
                      <div className="stat-detail-label">🔴 Peak Hour</div>
                      <div className="stat-detail-value">
                        {peakTimes.reduce((max, item) => 
                          item.count > max.count ? item : max
                        )?.hour || 'N/A'}
                      </div>
                      <div className="stat-detail-sub">
                        {Math.max(...peakTimes.map(t => t.count))} logins
                      </div>
                    </div>

                    <div className="stat-detail-box">
                      <div className="stat-detail-label">🟡 Average per Hour</div>
                      <div className="stat-detail-value">
                        {(peakTimes.reduce((sum, item) => sum + item.count, 0) / peakTimes.length).toFixed(1)}
                      </div>
                      <div className="stat-detail-sub">Across all hours</div>
                    </div>

                    <div className="stat-detail-box">
                      <div className="stat-detail-label">🟢 Lowest Hour</div>
                      <div className="stat-detail-value">
                        {peakTimes.reduce((min, item) => 
                          item.count < min.count ? item : min
                        )?.hour || 'N/A'}
                      </div>
                      <div className="stat-detail-sub">
                        {Math.min(...peakTimes.map(t => t.count))} logins
                      </div>
                    </div>

                    <div className="stat-detail-box">
                      <div className="stat-detail-label">📊 Total Logins</div>
                      <div className="stat-detail-value">
                        {peakTimes.reduce((sum, item) => sum + item.count, 0)}
                      </div>
                      <div className="stat-detail-sub">24-hour total</div>
                    </div>
                  </div>
                </div>
            {/* Peak Hours Chart */}
            {peakTimes.length > 0 && (
              <div style={{ marginTop: '40px' }}>
                <h3>⏱️ Login Activity by Hour</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart
                    data={peakTimes}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3498db" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                    <XAxis dataKey="hour" stroke="#7f8c8d" />
                    <YAxis stroke="#7f8c8d" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                      cursor={{ fill: 'rgba(52, 152, 219, 0.1)' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#3498db" 
                      fillOpacity={1} 
                      fill="url(#colorCount)"
                      name="Logins"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* No Data State */}
            {peakTimes.length === 0 && (
              <div className="empty-state-box">
                <p>📭 No login data available yet</p>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="section">
            <h2>👥 User Login Statistics</h2>
            {userStats.length > 0 ? (
              <>
                {/* User Stats Chart */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>📊 Top 10 Users by Login Count</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={userStats.slice(0, 10)}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                      <XAxis 
                        dataKey="email" 
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                        tick={{ fontSize: 11 }}
                        formatter={(value) => value.split('@')[0]}
                      />
                      <YAxis stroke="#7f8c8d" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                        cursor={{ fill: 'rgba(52, 152, 219, 0.1)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#3498db"
                        name="Login Count"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* User Table */}
                <h3>📋 Detailed User List</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Login Count</th>
                        <th>First Login</th>
                        <th>Last Login</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userStats.map((user, idx) => (
                        <tr key={idx}>
                          <td>{user.email}</td>
                          <td>
                            <span className="badge">{user.count}</span>
                          </td>
                          <td>
                            {new Date(user.firstLogin).toLocaleString('en-US')}
                          </td>
                          <td>
                            {new Date(user.lastLogin).toLocaleString('en-US')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state-box">
                <p>📭 No user data available yet</p>
              </div>
            )}
          </div>
        )}

        {/* Dates Tab */}
        {activeTab === 'dates' && (
          <div className="section">
            <h2>📅 Daily Login Statistics</h2>
            {Object.keys(dateStats).length > 0 ? (
              <>
                {/* Daily Logins Chart */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>📈 Logins Over Time</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart
                      data={Object.values(dateStats)
                        .reverse()
                        .slice(0, 30)}
                      margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#7f8c8d"
                        tick={{ fontSize: 11 }}
                        interval={Math.floor(Object.values(dateStats).length / 10) || 0}
                      />
                      <YAxis stroke="#7f8c8d" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                        cursor={{ stroke: '#3498db', strokeWidth: 2 }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalLogins" 
                        stroke="#27ae60" 
                        strokeWidth={3}
                        dot={{ fill: '#27ae60', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Total Logins"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="uniqueUserCount" 
                        stroke="#e74c3c" 
                        strokeWidth={3}
                        dot={{ fill: '#e74c3c', r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Unique Users"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Unique Users by Date */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>👥 Unique Users Per Day (Bar)</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart
                      data={Object.values(dateStats)
                        .reverse()
                        .slice(0, 14)}
                      margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                      <XAxis 
                        dataKey="date" 
                        stroke="#7f8c8d"
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis stroke="#7f8c8d" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                        cursor={{ fill: 'rgba(231, 76, 60, 0.1)' }}
                      />
                      <Bar 
                        dataKey="uniqueUserCount" 
                        fill="#f39c12"
                        name="Unique Users"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Table */}
                <h3>📋 Daily Details</h3>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Total Logins</th>
                        <th>Unique Users</th>
                        <th>Avg per User</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.values(dateStats)
                        .reverse()
                        .map((day, idx) => (
                          <tr key={idx}>
                            <td>{day.date}</td>
                            <td>
                              <span className="badge badge-primary">
                                {day.totalLogins}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-success">
                                {day.uniqueUserCount}
                              </span>
                            </td>
                            <td>
                              <span className="badge badge-warning">
                                {(day.totalLogins / day.uniqueUserCount).toFixed(1)}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="empty-state-box">
                <p>📭 No daily data available yet</p>
              </div>
            )}
          </div>
        )}

        {/* Peak Times Tab */}
        {activeTab === 'peak' && (
          <div className="section">
            <h2>🔥 Peak Login Hours</h2>
            {peakTimes.length > 0 ? (
              <>
                {/* Full Peak Times Chart */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>⏰ Complete Hourly Distribution (24 Hours)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                      data={peakTimes}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#ecf0f1" />
                      <XAxis dataKey="hour" stroke="#7f8c8d" />
                      <YAxis stroke="#7f8c8d" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                        cursor={{ fill: 'rgba(231, 76, 60, 0.1)' }}
                      />
                      <Bar 
                        dataKey="count" 
                        fill="#e74c3c"
                        name="Login Count"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Peak Hours Pie Chart */}
                <div style={{ marginBottom: '40px' }}>
                  <h3>🍰 Peak Hours Distribution (Pie Chart)</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <PieChart>
                      <Pie
                        data={peakTimes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ hour, count }) => `${hour}h: ${count}`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {peakTimes.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={[
                              '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
                              '#1abc9c', '#e67e22', '#34495e', '#c0392b', '#16a085',
                              '#d35400', '#8e44ad', '#27ae60', '#2980b9', '#16a085',
                              '#c0392b', '#d35400', '#e74c3c', '#3498db', '#2ecc71',
                              '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'
                            ][index % 24]
                          }
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #bdc3c7', borderRadius: '5px' }}
                        formatter={(value) => value}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>



                {/* Top 10 Hours */}
                <div>
                  <h3>🏆 Top 10 Peak Hours</h3>
                  <div className="table-container">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Rank</th>
                          <th>Hour</th>
                          <th>Login Count</th>
                          <th>Percentage</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...peakTimes]
                          .sort((a, b) => b.count - a.count)
                          .slice(0, 10)
                          .map((item, idx) => (
                            <tr key={idx}>
                              <td>
                                <span className="badge badge-dark">#{idx + 1}</span>
                              </td>
                              <td><strong>{item.hour}</strong></td>
                              <td>
                                <span className="badge badge-primary">
                                  {item.count}
                                </span>
                              </td>
                              <td>
                                {(
                                  (item.count /
                                    peakTimes.reduce((sum, t) => sum + t.count, 0)) *
                                  100
                                ).toFixed(1)}
                                %
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state-box">
                <p>📭 No peak time data available yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="refresh-button">
        <button onClick={fetchAllData} className="btn-refresh">
          🔄 Refresh Data
        </button>
      </div>
    </div>
  );
};

export default LoginAnalytics;
