import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import './LoginAnalytics.css';
import { API_BASE } from '../../../services/api';

const COLORS = [
  '#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6',
  '#1abc9c', '#e67e22', '#34495e', '#c0392b', '#16a085',
  '#d35400', '#8e44ad', '#27ae60', '#2980b9', '#16a085',
  '#c0392b', '#d35400', '#e74c3c', '#3498db', '#2ecc71',
  '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'
];

const LoginAnalytics = () => {
  const [summary, setSummary] = useState(null);
  const [userStats, setUserStats] = useState([]);
  const [dateStats, setDateStats] = useState({});
  const [peakTimes, setPeakTimes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState(null);

  /* ---------------- FETCH ---------------- */

  const fetchAllData = useCallback(async () => {
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
      setSummary(summaryData.data || null);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUserStats(usersData?.data?.users || []);
      }

      if (dateRes.ok) {
        const dateData = await dateRes.json();
        setDateStats(dateData?.data || {});
      }

      if (peakRes.ok) {
        const peakData = await peakRes.json();
        setPeakTimes(peakData?.data?.peakLoginTimes || []);
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  /* ---------------- MEMOIZED ANALYTICS ---------------- */

  const peakAnalytics = useMemo(() => {
    if (!peakTimes.length) {
      return {
        total: 0,
        average: '0.0',
        peakHour: 'N/A',
        lowestHour: 'N/A',
        max: 0,
        min: 0
      };
    }

    const total = peakTimes.reduce((sum, t) => sum + t.count, 0);

    const peak = peakTimes.reduce((a, b) => (b.count > a.count ? b : a));
    const lowest = peakTimes.reduce((a, b) => (b.count < a.count ? b : a));

    return {
      total,
      average: (total / peakTimes.length).toFixed(1),
      peakHour: peak.hour,
      lowestHour: lowest.hour,
      max: peak.count,
      min: lowest.count
    };
  }, [peakTimes]);

  const sortedTopPeakTimes = useMemo(() => {
    return [...peakTimes].sort((a, b) => b.count - a.count).slice(0, 10);
  }, [peakTimes]);

  const dateStatsArray = useMemo(() => {
    return Object.values(dateStats).reverse();
  }, [dateStats]);

  /* ---------------- RENDER ---------------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-[24px] shadow-sm border border-gray-100 mt-8">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
        <span className="text-gray-500 font-medium">Loading analytics data...</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">

          <h2 className="text-xl font-bold text-gray-800">System Login Analytics</h2>
        </div>
        <button onClick={fetchAllData} className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-semibold rounded-lg transition-colors border border-gray-200">
          <i data-lucide="refresh-cw" className="w-4 h-4"></i> Refresh Data
        </button>
      </div>

      {error && <div className="p-4 mb-6 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">{error}</div>}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-100 pb-4">
        {['summary', 'users', 'dates', 'peak'].map(tab => (
          <button
            key={tab}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${activeTab === tab ? 'bg-primary shadow-md shadow-primary/20' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'summary' && 'Overview'}
            {tab === 'users' && 'Users'}
            {tab === 'dates' && 'By Date'}
            {tab === 'peak' && 'Peak Hours'}
          </button>
        ))}
      </div>

      <div className="w-full">

        {/* SUMMARY */}
        {activeTab === 'summary' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><i data-lucide="pie-chart" className="w-5 h-5 text-gray-400"></i> System Overview</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Stat label="Peak Hour" value={peakAnalytics.peakHour} sub={`${peakAnalytics.max} logins`} icon="arrow-up-circle" color="text-red-500" bg="bg-red-50" />
              <Stat label="Avg / Hour" value={peakAnalytics.average} sub="Across all hours" icon="activity" color="text-blue-500" bg="bg-blue-50" />
              <Stat label="Lowest Hour" value={peakAnalytics.lowestHour} sub={`${peakAnalytics.min} logins`} icon="arrow-down-circle" color="text-green-500" bg="bg-green-50" />
              <Stat label="Total Logins" value={peakAnalytics.total} sub="24-hour total" icon="users" color="text-purple-500" bg="bg-purple-50" />
            </div>

            {peakTimes.length > 0 ? (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={peakTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#3498db" fill="#3498db" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="📭 No login data available yet" />
            )}
          </div>
        )}

        {/* USERS */}
        {activeTab === 'users' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><i data-lucide="users" className="w-5 h-5 text-gray-400"></i> User Login Statistics</h3>
            {userStats.length ? (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userStats.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="email" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="No user data available yet" />
            )}
          </div>
        )}

        {/* DATES */}
        {activeTab === 'dates' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><i data-lucide="calendar" className="w-5 h-5 text-gray-400"></i> Daily Login Statistics</h3>
            {dateStatsArray.length ? (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dateStatsArray.slice(0, 30)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Line type="smooth" dataKey="totalLogins" name="Total Logins" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  <Line type="smooth" dataKey="uniqueUserCount" name="Unique Users" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4, fill: '#f43f5e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty message="No daily data available yet" />
            )}
          </div>
        )}

        {/* PEAK */}
        {activeTab === 'peak' && (
          <div className="animate-fade-in">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><i data-lucide="clock" className="w-5 h-5 text-gray-400"></i> Peak Login Hours</h3>
            {peakTimes.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={peakTimes}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dx={-10} />
                      <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} cursor={{ fill: '#e2e8f0' }} />
                      <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto w-full custom-scrollbar">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="px-4 py-3 font-semibold text-gray-600">Rank</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Hour</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">Count</th>
                          <th className="px-4 py-3 font-semibold text-gray-600">% Activity</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {sortedTopPeakTimes.map((t, i) => {
                          const percentage = peakAnalytics.total ? ((t.count / peakAnalytics.total) * 100).toFixed(1) : '0.0';
                          return (
                            <tr key={i} className="hover:bg-white transition-colors">
                              <td className="px-4 py-3 font-medium text-gray-900">#{i + 1}</td>
                              <td className="px-4 py-3 text-gray-600">{t.hour}</td>
                              <td className="px-4 py-3 text-gray-900 font-bold">{t.count}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }}></div>
                                  </div>
                                  <span className="text-xs font-semibold text-gray-500">{percentage}%</span>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              <Empty message="No peak time data available yet" />
            )}
          </div>
        )}
      </div>

    </div>
  );
};

/* ---------------- SMALL COMPONENTS ---------------- */

const Stat = ({ label, value, sub, icon, bg, color }) => (
  <div className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors flex flex-col justify-between">
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg} ${color}`}>
        <i data-lucide={icon} className="w-5 h-5"></i>
      </div>
      <div className="text-sm font-semibold text-gray-500">{label}</div>
    </div>
    <div>
      <div className="text-2xl font-black text-gray-800 tracking-tight leading-none mb-1">{value}</div>
      <div className="text-xs font-medium text-gray-400">{sub}</div>
    </div>
  </div>
);

const Empty = ({ message }) => (
  <div className="flex flex-col items-center justify-center p-12 bg-gray-50 rounded-2xl border border-gray-100 text-center">
    <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm text-gray-400">
      <i data-lucide="inbox" className="w-6 h-6"></i>
    </div>
    <h3 className="text-base font-bold text-gray-800 mb-1">No Data</h3>
    <p className="text-sm text-gray-500">{message}</p>
  </div>
);

export default LoginAnalytics;
