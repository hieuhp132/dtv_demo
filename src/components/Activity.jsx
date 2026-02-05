import React, { useState, useEffect } from "react";
import "./Activity.css";

export default function Activity({ jobId }) {
  const [activities, setActivities] = useState([]);

  // Load activities from localStorage
  useEffect(() => {
    const savedActivities = localStorage.getItem(`activities_${jobId}`);
    if (savedActivities) {
      try {
        setActivities(JSON.parse(savedActivities));
      } catch (err) {
        console.error("Error loading activities:", err);
      }
    }
  }, [jobId]);

  // Add activity function (can be called from parent component)
  const addActivity = (type, description, metadata = {}) => {
    const newActivity = {
      id: Date.now(),
      type,
      description,
      timestamp: new Date().toISOString(),
      metadata,
    };

    const updatedActivities = [newActivity, ...activities];
    setActivities(updatedActivities);

    // Save to localStorage
    localStorage.setItem(`activities_${jobId}`, JSON.stringify(updatedActivities));
  };

  // Expose the addActivity function through a ref or context
  useEffect(() => {
    window.addJobActivity = addActivity;
  }, [activities]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
      const [loading, setLoading] = useState(true);
      const mounted = useRef(true);

      useEffect(() => {
        mounted.current = true;
        loadActivities();
        const id = setInterval(loadActivities, 10000);
        return () => {
          mounted.current = false;
          clearInterval(id);
        };
      }, [jobId]);

      const loadActivities = async () => {
        try {
          setLoading(true);
          const res = await fetch(`${API_BASE}/api/comments/activities?limit=50`);
          const data = await res.json();
          if (!mounted.current) return;
          if (data.success) {
            const list = (data.activities || []).filter((a) => (jobId ? (a.metadata?.jobId === jobId || a.jobId === jobId) : true));
            setActivities(list);
          }
        } catch (err) {
          console.error("Failed loading activities:", err);
        } finally {
          if (mounted.current) setLoading(false);
        }
      };
  };

  const getActivityIcon = (type) => {
    const icons = {
      create: "📝",
      edit: "✏️",
      delete: "🗑️",
      submit: "📤",
      approve: "✅",
      reject: "❌",
      comment: "💬",
      upload: "📁",
      download: "📥",
      status_change: "🔄",
    };
    return icons[type] || "📌";
  };

  const getActivityColor = (type) => {
    const colors = {
      create: "#10b981",
      edit: "#f59e0b",
      delete: "#ef4444",
      submit: "#3b82f6",
      approve: "#10b981",
      reject: "#ef4444",
      comment: "#8b5cf6",
      upload: "#06b6d4",
      download: "#3b82f6",
      status_change: "#f59e0b",
      view: "#6b7280",
    };
    return colors[type] || "#6b7280";
  };

  if (activities.length === 0) {
    return (
      <div className="activity-section">
        <h3>Activity Timeline</h3>
        <p className="no-activities">No activities yet</p>
      </div>
    );
  }

  return (
    <div className="activity-section">
      <h3>Activity Timeline</h3>
      <div className="activity-timeline">
        {activities.map((activity) => (
          <div key={activity.id} className="activity-item">
            <div
              className="activity-icon"
              style={{ backgroundColor: getActivityColor(activity.type) }}
            >
              {getActivityIcon(activity.type)}
            </div>
            <div className="activity-content">
              <p className="activity-description">{activity.description}</p>
              {activity.metadata?.details && (
                <p className="activity-details">{activity.metadata.details}</p>
              )}
              <span className="activity-time">{formatDate(activity.timestamp)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
