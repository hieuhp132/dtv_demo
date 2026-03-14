
import React, { useEffect, useMemo, useState } from "react";
import { listReferrals } from "../../../services/api.js";
import { useAuth } from "../../../context/AuthContext";
/* ================= CONSTANTS ================= */
export const STATUS_COLORS = {
  submitted: "#6366f1",    // Indigo
  under_review: "#8b5cf6", // Violet
  interviewing: "#ec4899", // Pink
  offer: "#10b981",        // Emerald
  hired: "#059669",        // Green
  onboard: "#3b82f6",      // Blue
  rejected: "#f43f5e",     // Rose
  other: "#94a3b8",        // Slate
};

const STATUS_OPTIONS = [
  "submitted",
  "under_review",
  "interviewing",
  "offer",
  "hired",
  "onboard",
  "rejected",
];

/* ================= SVG HELPERS ================= */
function polarToCartesian(cx, cy, r, angleDeg) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(angleRad),
    y: cy + r * Math.sin(angleRad),
  };
}

function describeArcSector(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const startOuter = polarToCartesian(cx, cy, rOuter, endAngle);
  const endOuter = polarToCartesian(cx, cy, rOuter, startAngle);
  const startInner = polarToCartesian(cx, cy, rInner, endAngle);
  const endInner = polarToCartesian(cx, cy, rInner, startAngle);

  const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArcFlag} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArcFlag} 1 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

/* ================= PIE CHART COMPONENT ================= */
function PieChart({ title, data, size = 200, thickness = 45 }) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = 0;

  const cx = size / 2;
  const cy = size / 2;
  const rOuter = size / 2 - 10;
  const rInner = rOuter - thickness;

  return (
    <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8 flex flex-col items-center">
      <h3 className="text-xl font-bold text-gray-800 mb-8">{title}</h3>
      <div className="chart-container">
        <svg width={size} height={size} className="pie-svg">
          {data.map((d, i) => {
            if (d.value === 0) return null;
            const start = angle;
            const sweep = (d.value / total) * 360;
            const end = start + sweep;
            angle = end;

            return (
              <path
                key={i}
                d={describeArcSector(cx, cy, rOuter, rInner, start, end)}
                fill={d.color}
                className="chart-path"
              />
            );
          })}
          <circle cx={cx} cy={cy} r={rInner - 4} fill="#fff" />
          <text x={cx} y={cy} className="pointer-events-none" textAnchor="middle">
            <tspan x={cx} dy="-0.2em" className="text-4xl font-extrabold fill-gray-800 tracking-tight">{total}</tspan>
            <tspan x={cx} dy="1.6em" className="text-[10px] font-bold fill-gray-500 tracking-widest uppercase">CANDIDATES</tspan>
          </text>
        </svg>
      </div>

      <div className="w-full max-w-sm mt-8 space-y-3 overflow-y-auto max-h-48 pr-2 custom-scrollbar">
        {data.map((d, i) => (
          <div key={i} className="flex flex-row items-center justify-between p-3 rounded-xl bg-gray-50 border border-transparent hover:border-gray-200 transition-colors" style={{ opacity: d.value === 0 ? 0.4 : 1 }}>
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full" style={{ background: d.color }} />
              <span className="text-sm font-medium text-gray-700 capitalize">{d.label.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900">{d.value}</span>
              <span className="text-xs font-semibold text-gray-500 w-8 text-right">({Math.round((d.value / total) * 100)}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ================= MAIN COMPONENT ================= */
export default function CandidateStatusCharts() {
  const { user } = useAuth();
  const adminId = user?._id;
  const email = user?.email || "";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminId) return;
    setLoading(true);
    listReferrals({ id: adminId, email, isAdmin: true, limit: 1000 })
      .then((res = []) => setRows(Array.isArray(res) ? res : []))
      .finally(() => setLoading(false));
  }, [adminId, email]);

  const statusCounts = useMemo(() => {
    const map = {};
    rows.forEach((r) => {
      const s = r?.status || "other";
      map[s] = (map[s] || 0) + 1;
    });
    STATUS_OPTIONS.forEach((s) => { map[s] = map[s] || 0; });
    return map;
  }, [rows]);

  const overallChartData = useMemo(() => 
    Object.keys(statusCounts).map((k) => ({
      label: k,
      value: statusCounts[k],
      color: STATUS_COLORS[k] || STATUS_COLORS.other,
    })), [statusCounts]
  );

  const focusChartData = useMemo(() => {
    const submitted = statusCounts.submitted || 0;
    const hired = (statusCounts.hired || 0) + (statusCounts.onboard || 0);
    const total = Object.values(statusCounts).reduce((s, v) => s + v, 0);

    return [
      { label: "New Leads (Submitted)", value: submitted, color: STATUS_COLORS.submitted },
      { label: "Success (Hired)", value: hired, color: STATUS_COLORS.hired },
      { label: "In Progress(Totals)", value: total - submitted - hired, color: STATUS_COLORS.other },
    ];
  }, [statusCounts]);

  if (loading) return (
      <div className="flex items-center justify-center p-12 bg-white rounded-[24px] shadow-sm border border-gray-100">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3"></div>
          <span className="text-gray-500 font-medium">Generating Insights...</span>
      </div>
  );
  if (!rows.length) return (
      <div className="flex flex-col items-center justify-center p-12 bg-white rounded-[24px] shadow-sm border border-gray-100 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-gray-400">
              <i data-lucide="bar-chart-2" className="w-8 h-8"></i>
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Data Available</h3>
          <p className="text-gray-500 text-sm">There is no candidate data to display yet.</p>
      </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <PieChart title="Overall Status Distribution" data={overallChartData} />
      <PieChart title="Conversion Pipeline" data={focusChartData} thickness={50} />
    </div>
  );
}