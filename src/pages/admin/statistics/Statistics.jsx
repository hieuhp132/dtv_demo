
import LoginAnalytics from "../../../components/chart/analysis/LoginAnalytics.jsx";
import CandidateStatusCharts from "../../../components/chart/analysis/CandidateStatusAnalytics.jsx";
import "./Statistics.css"; // Đảm bảo import file CSS bên dưới



export default function Statistics() {
  return (
    <div className="min-h-screen bg-[#f8fafc] py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-10 text-left">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Platform Overview</h2>
          <p className="text-gray-500 text-base">Real-time performance metrics and insights for your recruitment pipeline.</p>
        </header>
        <CandidateStatusCharts />
        <LoginAnalytics />
      </div>
    </div>
  );
}