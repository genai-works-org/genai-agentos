import { MainLayout } from '../components/layout/MainLayout';
import { useTheme } from '../contexts/ThemeContext';

const MainPage = () => {
  const { theme } = useTheme();

  return (
    <MainLayout currentPage="Home">
      <div className="flex-1 flex flex-col items-center justify-center p-4">
        <div
          className={`w-full max-w-4xl h-[500px] rounded-lg shadow-lg ${
            theme === 'light' ? 'bg-white' : 'bg-dark-bg'
          }`}
        >
          {/* Placeholder for chart */}
          <div className="flex items-center justify-center h-full">
            <p
              className={`text-lg ${
                theme === 'light' ? 'text-gray-600' : 'text-gray-300'
              }`}
            >
              Chart will be displayed here
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MainPage;
