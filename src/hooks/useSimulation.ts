import { useState, useEffect, useCallback } from 'react';
import { SimulationEngine } from '../core/simulation/SimulationEngine';
import { AllocatorType, WorkloadType, AllocatorMetrics, SimulationState } from '../types/allocator';
import { AllocatorScore } from '../core/simulation/SmartEdgeAlloc';

export const useSimulation = () => {
  const [engine] = useState(() => new SimulationEngine());
  const [simulationState, setSimulationState] = useState<SimulationState>(() => engine.getSimulationState());
  const [metrics, setMetrics] = useState<Map<AllocatorType, AllocatorMetrics>>(new Map());
  const [scores, setScores] = useState<AllocatorScore[]>([]);

  const updateState = useCallback(() => {
    setSimulationState(engine.getSimulationState());
    setMetrics(engine.getAllocatorMetrics());
    setScores(engine.getAllocatorScores());
  }, [engine]);

  useEffect(() => {
    const interval = setInterval(updateState, 100); // Update UI every 100ms
    return () => clearInterval(interval);
  }, [updateState]);

  const start = useCallback(() => {
    engine.start();
    updateState();
  }, [engine, updateState]);

  const stop = useCallback(() => {
    engine.stop();
    updateState();
  }, [engine, updateState]);

  const reset = useCallback(() => {
    engine.reset();
    updateState();
  }, [engine, updateState]);

  const setWorkloadType = useCallback((workloadType: WorkloadType) => {
    engine.setWorkloadType(workloadType);
    updateState();
  }, [engine, updateState]);

  const setSelectedAllocator = useCallback((allocator: AllocatorType) => {
    engine.setSelectedAllocator(allocator);
    updateState();
  }, [engine, updateState]);

  const setSmartMode = useCallback((enabled: boolean) => {
    engine.setSmartMode(enabled);
    updateState();
  }, [engine, updateState]);

  const setSpeed = useCallback((speed: number) => {
    engine.setSpeed(speed);
    updateState();
  }, [engine, updateState]);

  return {
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
    getCurrentAllocator: () => engine.getCurrentAllocator(),
    getAllocators: () => engine.getAllocators(),
    setFastBenchmarkMode: (enabled: boolean) => engine.setFastBenchmarkMode(enabled),
    engine
  };
};