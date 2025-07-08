import { FC, memo, SVGProps } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import ChatList from '@/components/chat/ChatList';
import SidebarToggleIcon from '@/assets/icons/sidebar.svg';
import NewChatIcon from '@/assets/icons/note.svg';
// import SearchChatsIcon from '@/assets/icons/search.svg';
import AgentsIcon from '@/assets/icons/agent.svg';
import A2AAgentsIcon from '@/assets/icons/a2a.svg';
import MCPAgentsIcon from '@/assets/icons/mcp.svg';
import FlowsIcon from '@/assets/icons/tree.svg';
import NewFlowIcon from '@/assets/icons/new-flow.svg';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (status: boolean) => void;
}

interface PageLink {
  path: string;
  title: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
}

const pages: PageLink[] = [
  { path: '/chat/new', title: 'New Chat', Icon: NewChatIcon },
  // { path: '', title: 'Search Chats', Icon: SearchChatsIcon },
  { path: '/agents', title: 'GenAI Agents', Icon: AgentsIcon },
  { path: '/a2a-agents', title: 'A2A Agents', Icon: A2AAgentsIcon },
  { path: '/mcp-agents', title: 'MCP Servers', Icon: MCPAgentsIcon },
  {
    path: '/agent-flows',
    title: 'Agent Flows',
    Icon: FlowsIcon,
  },
  {
    path: '/agent-flows/new',
    title: 'New Agent Flow',
    Icon: NewFlowIcon,
  },
];

const Sidebar: FC<SidebarProps> = memo(({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`max-h-[calc(100vh-64px)] px-2 transition-all duration-300 ease-in-out overflow-y-auto will-change-scroll ${
        collapsed ? 'w-[56px]' : 'w-[200px]'
      }`}
    >
      <div className="sticky top-0 bg-neutral-accent pt-[34px]">
        <SidebarToggleIcon
          onClick={() => setCollapsed(!collapsed)}
          className="ml-2 mb-8 cursor-pointer"
          aria-label="Toggle sidebar"
        />
        <nav className="flex flex-col gap-2">
          {pages.map(({ path, title, Icon }) => {
            const isActive = location.pathname === path;
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`w-full px-2 py-1.5 max-h-9 flex items-center rounded-xl transition-colors duration-200 ${
                  isActive
                    ? `bg-primary-white text-primary-accent`
                    : `hover:bg-gray-100`
                }`}
              >
                <Icon
                  className={`${
                    isActive ? 'text-primary-accent' : 'text-text-main'
                  } ${collapsed ? 'mr-0' : 'mr-2'}`}
                />

                <span
                  className={`font-medium transition-opacity duration-200 ${
                    collapsed ? 'opacity-0 w-0 overflow-hidden' : 'opacity-100'
                  }`}
                >
                  {title}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
      {!collapsed && <ChatList />}
    </aside>
  );
});

export default Sidebar;
