import { expect, afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    get length() { return Object.keys(store).length; },
  };
})();

vi.stubGlobal('localStorage', localStorageMock);

global.fetch = vi.fn();