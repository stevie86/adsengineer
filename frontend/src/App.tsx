import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AgenciesPage } from './pages/Admin/Agencies';
import { IntegrationView } from './pages/Admin/IntegrationView';
import { GTMCompilerPage } from './pages/GTMCompiler';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="gtm-compiler" element={<GTMCompilerPage />} />
          <Route path="admin/agencies" element={<AgenciesPage />} />
          <Route path="admin/agencies/:id" element={<IntegrationView />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
