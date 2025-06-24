import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, // Replace Dashboard with Home
  Cpu, 
  BarChart2, 
  Settings, 
  Trophy, 
  Menu, // Add this import
  Layers, // Add this import
  X // Add this import for close button
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const location = useLocation();
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> }, // Changed from Dashboard to Home
    { path: '/allocators', label: 'Allocators', icon: <Cpu size={20} /> },
    { path: '/performance', label: 'Performance', icon: <BarChart2 size={20} /> },
    { path: '/benchmark', label: 'Benchmark Suite', icon: <Trophy size={20} /> },
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800 sticky top-0 z-30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-gray-800"
            >
              <Menu size={20} />
            </button>
            <Link to="/" className="flex items-center gap-2">
              <Layers className="h-8 w-8 text-blue-500" />
              <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">
                  SmartEdgeAlloc
                </h1>
                <p className="text-xs text-gray-400">Memory Allocator Simulation</p>
              </div>
            </Link>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-blue-900/30 text-blue-400' 
                    : 'hover:bg-gray-800'
                }`}
              >
                {React.cloneElement(item.icon as React.ReactElement, { 
                  className: location.pathname === item.path ? 'text-blue-400' : 'text-gray-400'
                })}
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <motion.div 
            initial={{ x: -300 }}
            animate={{ x: 0 }}
            exit={{ x: -300 }}
            className="bg-gray-900 w-64 h-full overflow-auto p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Layers className="h-6 w-6 text-blue-500" />
                <span className="font-bold text-lg">SmartEdgeAlloc</span>
              </div>
              <button onClick={() => setSidebarOpen(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>
            
            <nav className="space-y-1">
              {navItems.map(item => (
                <Link 
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md w-full transition-colors ${
                    location.pathname === item.path 
                      ? 'bg-blue-900/30 text-blue-400' 
                      : 'hover:bg-gray-800'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {React.cloneElement(item.icon as React.ReactElement, { 
                    className: location.pathname === item.path ? 'text-blue-400' : 'text-gray-400'
                  })}
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </motion.div>
        </div>
      )}

      {/* Desktop Sidebar */}
      <div className="flex flex-1">
        <aside className="hidden lg:block w-64 bg-gray-900 border-r border-gray-800 fixed h-[calc(100vh-64px)] overflow-auto">
          <nav className="p-4 space-y-1">
            {navItems.map(item => (
              <Link 
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-md w-full transition-colors ${
                  location.pathname === item.path 
                    ? 'bg-blue-900/30 text-blue-400' 
                    : 'hover:bg-gray-800'
                }`}
              >
                {React.cloneElement(item.icon as React.ReactElement, { 
                  className: location.pathname === item.path ? 'text-blue-400' : 'text-gray-400'
                })}
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 lg:ml-64 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 py-4 px-6 text-center text-sm text-gray-400 mt-auto">
        <p>SmartEdgeAlloc Simulation Dashboard - Built with React, TypeScript, and advanced allocation algorithms</p>
      </footer>
    </div>
  );
};