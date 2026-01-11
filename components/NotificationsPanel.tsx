import React from 'react';

interface NotificationsPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ isOpen, onClose }) => {
    // Placeholder notifications - in future, fetch from database
    const notifications = [
        {
            id: 1,
            title: 'Streak milestone!',
            message: 'You\'ve maintained a 7-day streak!',
            time: '2 hours ago',
            read: false,
        },
        {
            id: 2,
            title: 'Task reminder',
            message: 'You have 3 tasks due today',
            time: '5 hours ago',
            read: true,
        },
    ];

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-12 w-80 bg-surface-dark border border-surface-border rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
                <h3 className="text-white font-bold text-sm">Notifications</h3>
                <button
                    onClick={onClose}
                    className="text-white/60 hover:text-white text-xs font-medium"
                >
                    Clear all
                </button>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
                {notifications.length > 0 ? (
                    notifications.map((notif) => (
                        <div
                            key={notif.id}
                            className={`p-4 border-b border-surface-border hover:bg-white/5 transition-colors cursor-pointer ${!notif.read ? 'bg-primary/5' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className="size-8 bg-primary/20 rounded-full flex items-center justify-center shrink-0">
                                    <span className="material-symbols-outlined text-primary text-[16px]">
                                        notifications
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-white font-medium text-sm">{notif.title}</h4>
                                        {!notif.read && (
                                            <span className="size-2 bg-primary rounded-full"></span>
                                        )}
                                    </div>
                                    <p className="text-white/60 text-xs mt-0.5">{notif.message}</p>
                                    <p className="text-white/40 text-[10px] mt-1">{notif.time}</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-8 text-center">
                        <span className="material-symbols-outlined text-white/20 text-[48px] mb-2 block">
                            notifications_off
                        </span>
                        <p className="text-white/40 text-sm">No notifications</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPanel;
