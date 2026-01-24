import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

export const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    navigate('/login');
  };

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/admin/agencies', label: 'Agencies', icon: '🏢' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex">
      <aside className={`bg-white shadow-lg transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-4 border-b flex justify-between items-center">
          <h1 className={`font-bold text-xl text-blue-600 ${!isSidebarOpen && 'hidden'}`}>AdsEngineer</h1>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 rounded hover:bg-gray-100">
            {isSidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {isSidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t">
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg w-full ${!isSidebarOpen && 'justify-center'}`}
          >
            <span>🚪</span>
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm h-16 flex items-center justify-end px-8">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">admin@adsengineer.com</span>
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
              A
            </div>
          </div>
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
