import React, { useState } from 'react';
import { Bell, X, Check, AlertCircle, Trophy, Users, Calendar } from 'lucide-react';
import { useNotificationStore } from '../../stores';
import { useAuth } from '../../contexts/AuthContext';
import Button from './Button';

const NotificationCenter = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    fetchNotifications
  } = useNotificationStore();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'tournament_started':
        return <Trophy className="h-4 w-4 text-frog-primary" />;
      case 'match_reminder':
        return <Calendar className="h-4 w-4 text-frog-secondary" />;
      case 'tournament_joined':
        return <Users className="h-4 w-4 text-frog-accent" />;
      default:
        return <AlertCircle className="h-4 w-4 text-frog-primary" />;
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleMarkAllAsRead = async () => {
    if (user) {
      await markAllAsRead(user.id);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    if (user) {
      fetchNotifications(user.id);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative p-2 text-white/80 hover:text-frog-primary transition-all duration-300 hover:scale-110 glass rounded-xl"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-frog-accent rounded-full animate-pulse flex items-center justify-center">
            <span className="text-xs text-white font-bold">{unreadCount}</span>
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <div className="absolute right-0 mt-2 w-80 glass-strong rounded-2xl shadow-glass-strong z-50 border border-white/20 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Notifications</h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="glass"
                      size="sm"
                      onClick={handleMarkAllAsRead}
                      className="text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Tout marquer
                    </Button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-white/60 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-frog-primary mx-auto"></div>
                  <p className="text-white/80 text-sm mt-2">Chargement...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-4 text-center">
                  <Bell className="h-8 w-8 text-white/40 mx-auto mb-2" />
                  <p className="text-white/80 text-sm">Aucune notification</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {notifications.slice(0, 10).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-white/5 transition-colors cursor-pointer ${
                        !notification.read ? 'bg-frog-primary/10' : ''
                      }`}
                      onClick={() => handleMarkAsRead(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white">
                            {notification.title}
                          </p>
                          <p className="text-xs text-white/80 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-white/60 mt-1">
                            {new Date(notification.created_at).toLocaleString('fr-FR')}
                          </p>
                        </div>
                        {!notification.read && (
                          <div className="flex-shrink-0">
                            <div className="h-2 w-2 bg-frog-primary rounded-full"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationCenter;
