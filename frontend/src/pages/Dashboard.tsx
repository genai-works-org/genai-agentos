import React from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { Progress } from '@/components/ui/progress';
import { LineChart } from '@/components/ui/linechart';

const recoveryStats = {
  diet: 80,
  activity: 60,
  medicine: 90,
  appointments: 50,
};
const recoveryTrend = [
  { day: 'Day 1', progress: 20 },
  { day: 'Day 2', progress: 35 },
  { day: 'Day 3', progress: 50 },
  { day: 'Day 4', progress: 60 },
  { day: 'Day 5', progress: 70 },
  { day: 'Day 6', progress: 85 },
  { day: 'Day 7', progress: 90 },
];

const Dashboard = () => {
  const { user, logout } = useAuth();

  const overallProgress = Math.round(
    (recoveryStats.diet +
      recoveryStats.activity +
      recoveryStats.medicine +
      recoveryStats.appointments) /
      4,
  );

  return (
    <MainLayout currentPage="Dashboard">
      <div className="p-6">
        <div className="bg-white rounded-2xl shadow-md p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
              🤖
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                Welcome back, {user?.username || ''}!
              </h2>
              <p className="text-sm text-gray-500">
                You can chat with Mila from the "Chats" section.
              </p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <h3 className="text-md font-medium text-gray-700">
              Overall Recovery Progress
            </h3>
            <div className="relative mx-auto w-28 h-28 flex items-center justify-center mt-2">
              <svg className="absolute w-full h-full" viewBox="0 0 36 36">
                <path
                  className="text-blue-200"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
                <path
                  className="text-blue-500"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  strokeDasharray={`${(overallProgress / 100) * 100}, 100`}
                  d="M18 2a16 16 0 1 1 0 32 16 16 0 1 1 0-32"
                />
              </svg>
              <span className="text-xl font-semibold">{overallProgress}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Diet */}
          <div className="bg-green-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🍎</span>
              <h4 className="font-semibold text-sm text-gray-700">Diet Plan</h4>
            </div>
            <Progress value={recoveryStats.diet} className="h-2 bg-green-100" />
            <p className="text-xs text-gray-600 mt-2">{recoveryStats.diet}%</p>
          </div>

          {/* Activity */}
          <div className="bg-yellow-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🏃‍♀️</span>
              <h4 className="font-semibold text-sm text-gray-700">
                Activity Plan
              </h4>
            </div>
            <Progress
              value={recoveryStats.activity}
              className="h-2 bg-yellow-100"
            />
            <p className="text-xs text-gray-600 mt-2">
              {recoveryStats.activity}%
            </p>
          </div>

          {/* Medicine */}
          <div className="bg-red-50 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">💊</span>
              <h4 className="font-semibold text-sm text-gray-700">Medicine</h4>
            </div>
            <Progress
              value={recoveryStats.medicine}
              className="h-2 bg-red-100"
            />
            <p className="text-xs text-gray-600 mt-2">
              {recoveryStats.medicine}%
            </p>
          </div>

          {/* Appointments */}
          <div className="bg-purple-50 rounded-xl p-4 shadow-sm col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">📅</span>
              <h4 className="font-semibold text-sm text-gray-700">
                Appointments
              </h4>
            </div>
            <Progress
              value={recoveryStats.appointments}
              className="h-2 bg-purple-100"
            />
            <p className="text-xs text-gray-600 mt-2">
              {recoveryStats.appointments}%
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md p-6 mt-6">
          <h3 className="text-md font-medium text-gray-700 mb-2">
            7-Day Recovery Trend
          </h3>
          <LineChart data={recoveryTrend} />
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
