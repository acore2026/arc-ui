import React from 'react';
import AppShell from '../components/AppShell';
import NavHeader from '../components/NavHeader';
import ArchitectureGraph from '../features/architecture/ArchitectureGraph';
import './ArchitecturePage.css';

const ArchitecturePage: React.FC = () => {
  return (
    <AppShell
      header={<NavHeader />}
      mainContent={<div className="architecture-page-stage"><ArchitectureGraph /></div>}
    />
  );
};

export default ArchitecturePage;
