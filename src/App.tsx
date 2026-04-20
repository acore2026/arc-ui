import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Workspace from './app/Workspace';
import ExecutionPage from './app/ExecutionPage';
import ArchitecturePage from './app/ArchitecturePage';
import ServiceAssurancePage from './app/ServiceAssurancePage';
import SkillLibraryModal from './features/navigation/SkillLibraryModal';
import { useStore } from './store/useStore';
import './App.css';

function AppContent() {
  const loadToolCatalog = useStore((state) => state.loadToolCatalog);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === '/architecture' || location.pathname === '/service-assurance') {
      return;
    }
    void loadToolCatalog();
  }, [loadToolCatalog, location.pathname]);

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/architecture" replace />} />
        <Route path="/architecture" element={<ArchitecturePage />} />
        <Route path="/service-assurance" element={<ServiceAssurancePage />} />
        <Route path="/workshop" element={<Workspace />} />
        <Route path="/execution" element={<ExecutionPage />} />
      </Routes>
      {(location.pathname === '/workshop' || location.pathname === '/execution') && <SkillLibraryModal />}
    </>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
