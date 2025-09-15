import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDebounce, useDebouncedCallback } from '../useDebounce';

describe('useDebounce', () => {
  it('returns initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 100));
    expect(result.current).toBe('initial');
  });

  it('debounces value changes', async () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'initial' } }
    );

    expect(result.current).toBe('initial');

    rerender({ value: 'updated' });
    expect(result.current).toBe('initial'); // Should still be initial

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current).toBe('updated');
  });
});

describe('useDebouncedCallback', () => {
  it('debounces callback execution', async () => {
    const callback = vi.fn();
    const { result } = renderHook(() => useDebouncedCallback(callback, 100));

    // Call multiple times quickly
    act(() => {
      result.current('arg1');
      result.current('arg2');
      result.current('arg3');
    });

    expect(callback).not.toHaveBeenCalled();

    // Wait for debounce to complete
    await waitFor(() => {
      expect(callback).toHaveBeenCalledTimes(1);
    }, { timeout: 200 });
    
    expect(callback).toHaveBeenCalledWith('arg3');
  });

  it('cleans up timeout on unmount', () => {
    const callback = vi.fn();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 100));

    act(() => {
      result.current('test');
    });

    unmount();

    // Wait to ensure callback would have been called
    act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(callback).not.toHaveBeenCalled();
  });
});

