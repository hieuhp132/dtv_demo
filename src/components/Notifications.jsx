import React, { useEffect, useState } from "react";
import "./Notifications.css";
import { IoClose } from "react-icons/io5";
import { formatDistanceToNow } from "date-fns";
import { fetchNotifications } from "../services/api.js";

export default function Notifications({ isOpen, onClose }) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleMarkAsRead = (notificationId) => {
    markNotificationAsRead(notificationId);
  };

  const handleClearAll = () => {
    notifications.forEach((notif) => {
      if (!notif.read) {
        markNotificationAsRead(notif.id);
      }
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="notifications-overlay" onClick={onClose}>
      <div
        className="notifications-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="notifications-header">
          <div className="header-title">
            <h2>Notifications</h2>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
          </div>
          <button className="close-btn" onClick={onClose}>
            <IoClose size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="notifications-content">
          {notifications.length === 0 ? (
            <div className="empty-state">No notifications</div>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? "read" : "unread"}`}
                >
                  <div className="notif-icon">{notif.icon}</div>
                  <div className="notif-content">
                    <h4>{notif.title}</h4>
                    <p>{notif.message}</p>
                    <span className="notif-time">
                      {formatDistanceToNow(new Date(notif.timestamp), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  {!notif.read && (
                    <button
                      className="mark-read-btn"
                      onClick={() => handleMarkAsRead(notif.id)}
                      title="Mark as read"
                    >
                      •
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="notifications-footer">
            <button className="clear-btn" onClick={handleClearAll}>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
