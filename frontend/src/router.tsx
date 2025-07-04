import { createBrowserRouter, redirect } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const A2AAgentsPage = lazy(() => import('./pages/A2AAgentsPage'));
const MCPAgentsPage = lazy(() => import('./pages/MCPAgentsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AgentsPage = lazy(() => import('./pages/AgentsPage'));
const AgentFlowsPage = lazy(() => import('./pages/AgentFlowsPage'));
const AgentFlowsEditPage = lazy(() => import('./pages/AgentFlowsEditPage'));
const AgentsTracePage = lazy(() => import('./pages/AgentsTracePage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <ChatPage />
          </Suspense>
        </ProtectedRoute>
      ),
      children: [
        {
          index: true,
          loader: () => redirect('/chat/new'),
        },
        {
          path: '/chat',
          loader: () => redirect('/chat/new'),
        },
      ],
    },
    {
      path: '/login',
      element: (
        <PublicRoute>
          <Suspense fallback={<LoadingFallback />}>
            <LoginPage />
          </Suspense>
        </PublicRoute>
      ),
    },
    {
      path: '/signup',
      element: (
        <PublicRoute>
          <Suspense fallback={<LoadingFallback />}>
            <SignupPage />
          </Suspense>
        </PublicRoute>
      ),
    },
    {
      path: '/settings',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <SettingsPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/chat/:id',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <ChatPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/agents',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AgentsPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/agent-flows',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AgentFlowsPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/agent-flows/:id',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AgentFlowsEditPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/agents-trace',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <AgentsTracePage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/a2a-agents',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <A2AAgentsPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '/mcp-agents',
      element: (
        <ProtectedRoute>
          <Suspense fallback={<LoadingFallback />}>
            <MCPAgentsPage />
          </Suspense>
        </ProtectedRoute>
      ),
    },
    {
      path: '*',
      element: (
        <Suspense fallback={<LoadingFallback />}>
          <NotFoundPage />
        </Suspense>
      ),
    },
  ],
  {
    future: {
      v7_relativeSplatPath: true,
    },
  },
);
