import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import AllocatorsPage from './pages/AllocatorsPage';
import PerformancePage from './pages/PerformancePage';
import SettingsPage from './pages/SettingsPage';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useSimulation } from './hooks/useSimulation';
import './index.css';

function App() {
  // Use the existing useSimulation hook to connect to the simulation engine
  const {
    simulationState,
    metrics,
    scores,
    start,
    stop,
    reset,
    setWorkloadType,
    setSelectedAllocator,
    setSmartMode,
    setSpeed,
    getCurrentAllocator
  } = useSimulation();

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route 
              path="/" 
              element={
                <DashboardPage 
                  simulationState={simulationState}
                  metrics={metrics}
                  onStart={start}
                  onPause={stop}
                  onReset={reset}
                  onWorkloadChange={setWorkloadType}
                  onAllocatorChange={setSelectedAllocator}
                  onSmartModeToggle={setSmartMode}
                  onSpeedChange={setSpeed}
                  getCurrentAllocator={getCurrentAllocator}
                />
              } 
            />
            <Route 
              path="/allocators" 
              element={
                <AllocatorsPage 
                  metrics={metrics}
                  scores={scores}
                  selectedAllocator={simulationState.selectedAllocator}
                />
              } 
            />
            <Route 
              path="/performance" 
              element={<PerformancePage metrics={metrics} />} 
            />
            <Route 
              path="/settings" 
              element={<SettingsPage onReset={reset} />} 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;