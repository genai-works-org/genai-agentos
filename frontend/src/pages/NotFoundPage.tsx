import { Link } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Layout from '../components/layout/AuthLayout';

const NotFoundPage = () => {
  const { theme } = useTheme();

  return (
    <Layout>
      <div className="max-w-md w-full space-y-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h2
            className={`text-center text-3xl font-extrabold ${
              theme === 'light' ? 'text-light-text' : 'text-dark-text'
            }`}
          >
            404 - Page Not Found
          </h2>
          <p
            className={`mt-2 text-center text-sm ${
              theme === 'light' ? 'text-light-text' : 'text-dark-text'
            }`}
          >
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="text-center">
          <Link
            to="/"
            className={`${
              theme === 'light'
                ? 'text-light-secondary-primary hover:text-light-secondary-secondary'
                : 'text-dark-secondary-primary hover:text-dark-secondary-secondary'
            }`}
          >
            Return to Home
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFoundPage;
