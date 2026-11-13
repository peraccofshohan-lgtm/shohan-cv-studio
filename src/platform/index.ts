/**
 * Platform selection: the Electron preload bridge when present, otherwise the
 * browser adapter. Resolved once and cached.
 */
import type { ShohanBridge } from './types';
import { createBrowserBridge } from './browserAdapter';

let cached: ShohanBridge | null = null;

export function getBridge(): ShohanBridge {
  if (cached) return cached;
  if (typeof window !== 'undefined' && window.shohan) {
    cached = window.shohan;
    return cached;
  }
  cached = createBrowserBridge();
  return cached;
}

export function isDesktop(): boolean {
  return typeof window !== 'undefined' && !!window.shohan;
}

export type { ShohanBridge, PlatformInfo } from './types';
