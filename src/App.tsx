import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import AllocatorsPage from './pages/AllocatorsPage';
import PerformancePage from './pages/PerformancePage';
import SettingsPage from './pages/SettingsPage';
import BenchmarkPage from './pages/BenchmarkPage';
import ErrorBoundary from './components/ErrorBoundary';
import { useSimulation } from './hooks/useSimulation';
import { AllocatorType, WorkloadType, SimulationState } from './types/allocator';
import './index.css';

// Create a minimal simulation controller
const defaultSimulationState: SimulationState = {
  isRunning: false,
  currentTime: 0,
  workloadType: WorkloadType.RANDOM,
  selectedAllocator: AllocatorType.FREE_LIST,
  smartMode: true,
  speed: 1,
  demoMode: false,
  currentDemoAllocator: null,
  demoPhase: 'individual',
  demoProgress: 0
};

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

  // Get the engine instance
  const simulationEngine = useSimulation().engine;

  const [appSimulationState, setAppSimulationState] = useState<SimulationState>(defaultSimulationState);
  const [appMetrics, setAppMetrics] = useState(new Map());

  // Mock functions for now - you can implement real functionality later
  const handleStart = () => console.log('Start');
  const handlePause = () => console.log('Pause');
  const handleReset = () => console.log('Reset');
  const handleWorkloadChange = (w: WorkloadType) => console.log('Workload', w);
  const handleAllocatorChange = (a: AllocatorType) => console.log('Allocator', a);
  const handleSmartModeToggle = (enabled: boolean) => console.log('Smart mode', enabled);
  const handleSpeedChange = (speed: number) => console.log('Speed', speed);
  const getCurrentAllocatorMock = () => ({ getMemoryBlocks: () => [] });

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
            <Route 
              path="/benchmark" 
              element={
                <BenchmarkPage 
                  simulationEngine={simulationEngine} 
                />
              } 
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;