import { FC, memo, SVGProps } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { PlusIcon } from 'lucide-react';
import ChatList from '../ChatList';
import AgentIcon from '../../assets/icons/agent.svg';
import NoteIcon from '../../assets/icons/note.svg';
// import SearchIcon from '../../assets/icons/search.svg';
import TreeIcon from '../../assets/icons/tree.svg';
import SidebarIcon from '../../assets/icons/sidebar.svg';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (status: boolean) => void;
}

interface PageLink {
  path: string;
  title: string;
  Icon: FC<SVGProps<SVGSVGElement>>;
  plusBtnNav?: string;
}

const pages: PageLink[] = [
  { path: '/chat/new', title: 'New Chat', Icon: NoteIcon },
  { path: '/agents', title: 'Agents', Icon: AgentIcon },
  {
    path: '/agent-flows',
    title: 'Agent Flows',
    Icon: TreeIcon,
    plusBtnNav: '/agent-flows/new',
  },
  { path: '/a2a-agents', title: 'A2A Agents', Icon: AgentIcon },
  { path: '/mcp-agents', title: 'MCP Agents', Icon: AgentIcon },
];

const Sidebar: FC<SidebarProps> = memo(({ collapsed, setCollapsed }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={`pt-[34px] px-2 transition-all duration-300 ease-in-out ${
        collapsed ? 'w-[56px]' : 'w-[220px]'
      }`}
    >
      <SidebarIcon
        onClick={() => setCollapsed(!collapsed)}
        className="ml-2 mb-8 cursor-pointer"
        aria-label="Toggle sidebar"
      />
      <nav>
        {pages.map(({ path, title, Icon, plusBtnNav }) => {
          const isActive = location.pathname.includes(path);
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

              {plusBtnNav && !collapsed && (
                <Link
                  to={plusBtnNav}
                  className={`ml-8 p-2 rounded-md bg-[#FF5722] text-white hover:bg-[#E64A19]`}
                >
                  <PlusIcon className="h-2 w-2" />
                </Link>
              )}
            </button>
          );
        })}

        <ChatList />
      </nav>
    </aside>
  );
});

export default Sidebar;
