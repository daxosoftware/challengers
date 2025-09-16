import { useEffect, useRef } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  componentName: string;
  timestamp: number;
}

export const usePerformanceMonitor = (componentName: string) => {
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef<number>(0);

  useEffect(() => {
    renderStartTime.current = performance.now();
    renderCount.current += 1;

    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      
      // Log performance metrics in development only
      if (import.meta.env.DEV) {
        console.log(`[Performance] ${componentName}:`, {
          renderTime: `${renderTime.toFixed(2)}ms`,
          renderCount: renderCount.current,
          timestamp: new Date().toISOString()
        });
      }

      // Send metrics to analytics in production (silent)
      if (import.meta.env.PROD && renderTime > 16) { // 60fps threshold
        // Send to analytics service instead of console
        // analyticsService.track('performance_warning', {
        //   component: componentName,
        //   renderTime,
        //   timestamp: Date.now()
        // });
      }
    };
  });
};

export const useRenderCount = (componentName: string) => {
  const renderCount = useRef<number>(0);
  
  useEffect(() => {
    renderCount.current += 1;
    
    if (import.meta.env.DEV) {
      console.log(`[Render Count] ${componentName}: ${renderCount.current}`);
    }
  });

  return renderCount.current;
};
