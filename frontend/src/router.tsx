import { createBrowserRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const A2AAgentsPage = lazy(() => import('./pages/A2AAgentsPage'));
const MCPAgentsPage = lazy(() => import('./pages/MCPAgentsPage'));
const SettingsPage = lazy(() =>
  import('./pages/SettingsPage').then(module => ({
    default: module.SettingsPage,
  })),
);
const AgentsPage = lazy(() =>
  import('./pages/AgentsPage').then(module => ({ default: module.AgentsPage })),
);
const AgentDetailsPage = lazy(() =>
  import('./pages/AgentDetailsPage').then(module => ({
    default: module.AgentDetailsPage,
  })),
);
const AgentFlowsPage = lazy(() =>
  import('./pages/AgentFlowsPage').then(module => ({
    default: module.AgentFlowsPage,
  })),
);
const AgentFlowsEditPage = lazy(() =>
  import('./pages/AgentFlowsEditPage').then(module => ({
    default: module.AgentFlowsEditPage,
  })),
);
const AgentsTracePage = lazy(() =>
  import('./pages/AgentsTracePage').then(module => ({
    default: module.default,
  })),
);
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
  </div>
);

export const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <ChatPage />
        </Suspense>
      </ProtectedRoute>
    ),
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
      <Suspense fallback={<LoadingFallback />}>
        <SettingsPage />
      </Suspense>
    ),
  },
  {
    path: '/chat',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <ChatPage />
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
    path: '/chat/new',
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
    path: '/agents/:id/details',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingFallback />}>
          <AgentDetailsPage />
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
]);
