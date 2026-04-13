import React from 'react';
import ArchitectureGraph from '../features/architecture/ArchitectureGraph';

const ArchitecturePage: React.FC = () => {
  return (
    <main style={{ width: '100%', height: '100dvh', minHeight: 0, background: '#ffffff' }}>
      <ArchitectureGraph />
    </main>
  );
};

export default ArchitecturePage;
