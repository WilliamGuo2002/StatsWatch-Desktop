import type { StatsWatchApi } from '../shared/api';

declare global {
  interface Window {
    statswatch: StatsWatchApi;
  }
}

export {};
