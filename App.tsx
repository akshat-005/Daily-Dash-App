import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import AuthPage from './src/components/Auth/AuthPage';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import TaskColumn from './components/TaskColumn';
import StatsColumn from './components/StatsColumn';
import LoadingSpinner from './src/components/LoadingSpinner';
import MobileView from './components/MobileView';
import DesktopSidebarNav, { DesktopView } from './components/DesktopSidebarNav';
import DesktopRevisitsPage from './components/DesktopRevisitsPage';
import DesktopCalendarPage from './components/DesktopCalendarPage';
import TypewriterGreeting from './components/TypewriterGreeting';
import { useTaskStore } from './src/stores/taskStore';
import { useStatsStore } from './src/stores/statsStore';
import { useCategoryStore } from './src/stores/categoryStore';
import { useRevisitStore } from './src/stores/revisitStore';
import { formatDate, formatDisplayDate, addDays } from './src/utils/dateUtils';
import { useMediaQuery } from './src/utils/useMediaQuery';
import { initializeDailyNotifications, updateDailyNotificationData, clearDailyNotifications } from './src/utils/dailyNotifications';
import { requestNotificationPermission, subscribeToPush, getVapidPublicKey } from './src/utils/notifications';
import { clearAllReminders } from './src/utils/deadlineReminder';
import { savePushSubscription } from './src/api/pushSubscriptions';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeView, setActiveView] = useState<DesktopView>('dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const isMobile = useMediaQuery('(max-width: 900px)');

  const tasks = useTaskStore((state) => state.tasks);
  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const subscribeToTasks = useTaskStore((state) => state.subscribeToTasks);
  const streak = useStatsStore((state) => state.streak);
  const dailyStats = useStatsStore((state) => state.dailyStats);
  const updateStreak = useStatsStore((state) => state.updateStreak);
  const fetchDailyStats = useStatsStore((state) => state.fetchDailyStats);
  const fetchWeeklyMomentum = useStatsStore((state) => state.fetchWeeklyMomentum);
  const fetchCategories = useCategoryStore((state) => state.fetchCategories);
  const fetchTodayRevisits = useRevisitStore((state) => state.fetchTodayRevisits);

  useEffect(() => {
    if (user) {
      const dateStr = formatDate(currentDate);

      // Fetch all data for current date
      fetchTasks(user.id, dateStr);
      updateStreak(user.id);
      fetchDailyStats(user.id, dateStr);
      fetchWeeklyMomentum(user.id);
      fetchCategories(user.id);
      fetchTodayRevisits(user.id);

      // Request notification permission and subscribe to push
      const setupPushNotifications = async () => {
        const granted = await requestNotificationPermission();
        if (granted && getVapidPublicKey()) {
          // Subscribe to Web Push and save to database
          const subscription = await subscribeToPush();
          if (subscription) {
            try {
              await savePushSubscription(user.id, subscription);
              console.log('[Push] Subscribed to push notifications');
            } catch (error) {
              console.error('[Push] Failed to save subscription:', error);
            }
          }
        }
      };
      setupPushNotifications();

      // Subscribe to real-time task updates
      const unsubscribe = subscribeToTasks(user.id, dateStr);

      return () => {
        unsubscribe();
        // Clear daily notifications on unmount
        clearDailyNotifications();
        clearAllReminders();
      };
    }
  }, [user, currentDate]);

  // Initialize daily notifications when stats are available
  useEffect(() => {
    if (user && streak && dailyStats !== undefined) {
      const today = formatDate(new Date());
      const isToday = formatDate(currentDate) === today;

      // Calculate if user has activity today
      const hasActivityToday = tasks.some(t => t.isCompleted) || (dailyStats?.tasks_completed ?? 0) > 0;

      const notificationData = {
        currentStreak: streak?.current_streak ?? 0,
        tasksCompleted: dailyStats?.tasks_completed ?? 0,
        tasksTotal: dailyStats?.tasks_total ?? tasks.length,
        dailyScore: dailyStats?.daily_score ?? 0,
        hasActivityToday,
      };

      if (isToday) {
        initializeDailyNotifications(notificationData);
      }
    }
  }, [user, streak, dailyStats, tasks, currentDate]);

  const handlePreviousDay = () => {
    setCurrentDate((prev) => addDays(prev, -1));
  };

  const handleNextDay = () => {
    setCurrentDate((prev) => addDays(prev, 1));
  };

  const handleDateSelect = (date: Date) => {
    setCurrentDate(date);
  };

  // Mobile View
  if (isMobile) {
    return <MobileView currentDate={currentDate} onDateSelect={handleDateSelect} />;
  }

  // Desktop View with Sidebar Navigation
  return (
    <div className="flex min-h-screen bg-background-dark">
      {/* Fixed Sidebar Navigation */}
      <DesktopSidebarNav
        activeView={activeView}
        onNavigate={setActiveView}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {activeView === 'dashboard' && (
          <>
            <Header />
            <main className="p-3 md:p-4 lg:p-6 max-w-[1400px] mx-auto w-full">
              {/* Top Section with Greeting and Date */}
              <div className="grid grid-cols-12 gap-4 mb-6">
                {/* Space 1: Typewriter Greeting */}
                <div className="col-span-4">
                  <TypewriterGreeting userName={user?.user_metadata?.name || user?.email?.split('@')[0] || 'there'} />
                </div>

                {/* Center: Date Navigation */}
                <div className="col-span-4 flex flex-col items-center justify-center gap-1.5">
                  <div className="flex items-center gap-3 bg-surface-dark border border-surface-border rounded-full p-1 pr-4 shadow-card hover:border-primary/50 transition-colors group">
                    <button
                      onClick={handlePreviousDay}
                      className="size-8 rounded-full bg-surface-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_left</span>
                    </button>
                    <div className="flex items-center gap-1.5 px-1.5 cursor-pointer">
                      <span className="material-symbols-outlined text-primary group-hover:scale-110 transition-transform text-[20px]">calendar_today</span>
                      <h2 className="text-base md:text-lg font-bold whitespace-nowrap">
                        {formatDisplayDate(currentDate)}
                      </h2>
                    </div>
                    <button
                      onClick={handleNextDay}
                      className="size-8 rounded-full bg-surface-border flex items-center justify-center hover:bg-primary hover:text-black transition-colors"
                    >
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  </div>
                  <p className="text-[#9db9a8] text-xs md:text-sm font-medium tracking-wide uppercase">Build Momentum Today</p>
                </div>

                {/* Space 2: Empty for now (can be used for quick stats later) */}
                <div className="col-span-4"></div>
              </div>

              {/* 3-Column Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-full">
                <Sidebar
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                  onNavigateToCalendar={() => setActiveView('calendar')}
                />
                <TaskColumn currentDate={currentDate} />
                <StatsColumn
                  currentDate={currentDate}
                  onNavigateToRevisits={() => setActiveView('revisits')}
                />
              </div>
            </main>
          </>
        )}

        {activeView === 'calendar' && (
          <DesktopCalendarPage currentDate={currentDate} />
        )}

        {activeView === 'revisits' && (
          <DesktopRevisitsPage currentDate={currentDate} />
        )}

        {activeView === 'stats' && (
          <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-white text-2xl font-bold mb-6">Statistics</h1>
            <StatsColumn currentDate={currentDate} compact={true} />
          </div>
        )}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1A2520',
            color: '#fff',
            border: '1px solid #28392f',
          },
          success: {
            iconTheme: {
              primary: '#2bee79',
              secondary: '#1A2520',
            },
          },
        }}
      />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background-dark flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return <DashboardContent />;
};

export default App;