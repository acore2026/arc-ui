import React from 'react';
import ArchitectureGraph from '../features/architecture/ArchitectureGraph';

const ArchitecturePage: React.FC = () => {
  return (
    <main style={{ width: '100vw', height: '100vh', background: '#ffffff' }}>
      <ArchitectureGraph />
    </main>
  );
};

export default ArchitecturePage;
