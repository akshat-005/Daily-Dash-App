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
import { useTaskStore } from './src/stores/taskStore';
import { useReflectionStore } from './src/stores/reflectionStore';
import { useStatsStore } from './src/stores/statsStore';
import { formatDate, formatDisplayDate, addDays } from './src/utils/dateUtils';
import { useMediaQuery } from './src/utils/useMediaQuery';

const DashboardContent: React.FC = () => {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const isMobile = useMediaQuery('(max-width: 900px)');

  const fetchTasks = useTaskStore((state) => state.fetchTasks);
  const subscribeToTasks = useTaskStore((state) => state.subscribeToTasks);
  const fetchReflection = useReflectionStore((state) => state.fetchReflection);
  const fetchStreak = useStatsStore((state) => state.fetchStreak);
  const fetchDailyStats = useStatsStore((state) => state.fetchDailyStats);
  const fetchWeeklyMomentum = useStatsStore((state) => state.fetchWeeklyMomentum);

  useEffect(() => {
    if (user) {
      const dateStr = formatDate(currentDate);

      // Fetch all data for current date
      fetchTasks(user.id, dateStr);
      fetchReflection(user.id, dateStr);
      fetchStreak(user.id);
      fetchDailyStats(user.id, dateStr);
      fetchWeeklyMomentum(user.id);

      // Subscribe to real-time task updates
      const unsubscribe = subscribeToTasks(user.id, dateStr);
      return () => unsubscribe();
    }
  }, [user, currentDate]);

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

  // Desktop View
  return (
    <>
      <Header />

      <main className="flex-1 p-3 md:p-4 lg:p-6 max-w-[1600px] mx-auto w-full">
        {/* Header Date Section */}
        <div className="flex flex-col items-center justify-center mb-6 text-center gap-1.5">
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

        {/* 3-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start h-full">
          <Sidebar currentDate={currentDate} onDateSelect={handleDateSelect} />
          <TaskColumn currentDate={currentDate} />
          <StatsColumn currentDate={currentDate} />
        </div>
      </main>
    </>
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