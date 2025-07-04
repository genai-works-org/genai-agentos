import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LogProvider } from './contexts/LogContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { ChatHistoryProvider } from './contexts/ChatHistoryContext';
import { router } from './router';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ChatHistoryProvider>
          <SettingsProvider>
            <LogProvider>
              <RouterProvider
                router={router}
                future={{
                  v7_startTransition: true,
                }}
              />
              <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
                className="pt-20"
              />
            </LogProvider>
          </SettingsProvider>
        </ChatHistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
