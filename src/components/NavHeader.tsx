import React from 'react';
import { NavLink } from 'react-router-dom';
import { Waypoints } from 'lucide-react';
import StatusPill from './StatusPill';
import { useStore } from '../store/useStore';
import '../app/Workspace.css';

interface NavHeaderProps {
  children?: React.ReactNode;
}

const primaryNavItems = [
  { to: '/architecture', label: 'Architecture' },
  { to: '/service-assurance', label: 'Service Assurance' },
  { to: '/workshop', label: 'Workshop' },
  { to: '/execution', label: 'Execution' },
];

const NavHeader: React.FC<NavHeaderProps> = ({ children }) => {
  const { appState } = useStore();

  return (
    <div className="workspace-toolbar-stack">
      <div className="workspace-toolbar">
        <div className="toolbar-brand">
          <div className="brand-mark">
            <Waypoints size={18} strokeWidth={2.1} />
          </div>
          <div>
            <div className="brand-title">6G Agentic Core Big Screen</div>
          </div>
        </div>

        <nav className="toolbar-primary-nav" aria-label="Primary navigation">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) => `toolbar-nav-link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="toolbar-status">
          <StatusPill status={appState} />
        </div>
      </div>

      {children ? (
        <div className="workspace-toolbar-section workspace-toolbar-actions-row">
          {children}
        </div>
      ) : null}
    </div>
  );
};

export default NavHeader;
