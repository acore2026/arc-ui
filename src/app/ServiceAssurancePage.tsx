import React from 'react';
import AppShell from '../components/AppShell';
import NavHeader from '../components/NavHeader';
import ServiceAssuranceCanvas from '../features/architecture/ServiceAssuranceCanvas';
import './ArchitecturePage.css';

const ServiceAssurancePage: React.FC = () => {
  return (
    <AppShell
      header={<NavHeader />}
      mainContent={<div className="architecture-page-stage"><ServiceAssuranceCanvas /></div>}
    />
  );
};

export default ServiceAssurancePage;
