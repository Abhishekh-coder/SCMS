import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  FileText, 
  ArrowRight,
  RotateCcw,
  Sparkles,
  Inbox
} from 'lucide-react';
import apiClient from '../../core/api/apiClient';

export default function NotificationsView({ onSelectComplaint }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const url = filter === 'UNREAD' 
        ? '/notifications?unreadOnly=true&limit=50' 
        : '/notifications?limit=50';
      const res = await apiClient.get(url);
      if (res && res.data) {
        setNotifications(res.data);
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationUuid) => {
    try {
      await apiClient.patch(`/notifications/${notificationUuid}/read`);
      setNotifications(prev => prev.map(n => 
        n.notificationUuid === notificationUuid ? { ...n, readStatus: true } : n
      ));
    } catch (e) {
      console.error('Failed to mark notification as read:', e);
    }
  };

  const handleMarkAllAsRead = async () => {
    setUpdating(true);
    try {
      await apiClient.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, readStatus: true })));
    } catch (e) {
      console.error('Failed to mark all as read:', e);
    } finally {
      setUpdating(false);
    }
  };

  const getNotificationIcon = (type) => {
    switch (String(type || '').toUpperCase()) {
      case 'COMPLAINT_RESOLVED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'COMPLAINT_ESCALATED':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'STATUS_CHANGED':
      case 'COMPLAINT_ASSIGNED':
        return <ArrowRight className="w-4 h-4 text-blue-400" />;
      default:
        return <Bell className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatTimestamp = (d) => {
    if (!d) return 'Recently';
    const date = new Date(d);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const unreadCount = notifications.filter(n => !n.readStatus).length;

  return (
    <div className="space-y-6 w-full max-w-4xl mx-auto">
      
      {/* ── Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Notification Center</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time status updates, SLA reminders, and workflow alerts for your grievances.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              type="button"
              disabled={updating}
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 hover:text-slate-900 transition cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Mark all as read</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            title="Refresh Notifications"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* ── Filter Tabs ── */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 w-fit">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            filter === 'ALL'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Notifications ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter('UNREAD')}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
            filter === 'UNREAD'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Unread Only ({unreadCount})
        </button>
      </div>

      {/* ── Notifications List ── */}
      <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Loading notification records...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 border border-slate-200 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">No Notifications</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {filter === 'UNREAD' 
                ? 'You have caught up with all your unread alerts!' 
                : 'You have no system notifications yet. Updates will appear here as your grievances progress.'}
            </p>
          </div>
        ) : (
          notifications.map((item) => {
            const isUnread = !item.readStatus;
            return (
              <div
                key={item.notificationUuid || item._id}
                className={`p-4 sm:p-5 flex items-start justify-between gap-4 transition-colors ${
                  isUnread ? 'bg-blue-50/50 hover:bg-blue-50/80' : 'hover:bg-slate-50/80'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                    {getNotificationIcon(item.type || item.eventType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold leading-tight ${isUnread ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
                        {item.title || item.subject || 'Complaint Update'}
                      </p>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" title="Unread" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
                      {item.message || item.body || item.content}
                    </p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-400">
                      <span>{formatTimestamp(item.createdAt)}</span>
                      {item.complaintCode && (
                        <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.complaintCode}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkAsRead(item.notificationUuid)}
                      className="p-1.5 text-xs text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {item.complaintUuid && onSelectComplaint && (
                    <button
                      type="button"
                      onClick={() => onSelectComplaint({ complaintUuid: item.complaintUuid, complaintCode: item.complaintCode })}
                      className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-xs font-semibold text-blue-700 transition flex items-center gap-1 cursor-pointer"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
