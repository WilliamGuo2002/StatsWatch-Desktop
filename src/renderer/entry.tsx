import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// HashRouter, not BrowserRouter: the packaged app is loaded over file://,
// where history-based routing has no server to resolve paths against.
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './i18n';
import './index.css';
import App from './App';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

const root = createRoot(document.getElementById('root')!);

// The bridge is installed by the preload. If it is missing the app cannot
// do anything, so say why instead of rendering an empty window.
if (!window.statswatch) {
  root.render(
    <div
      style={{
        padding: '48px',
        fontFamily: 'system-ui, sans-serif',
        color: '#f87171',
        lineHeight: 1.7,
      }}
    >
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>Preload script did not load</h1>
      <p style={{ color: '#cbd5e1' }}>
        <code>window.statswatch</code> is undefined, so the renderer cannot reach the
        main process.
      </p>
      <p style={{ color: '#94a3b8', fontSize: 14 }}>
        The preload runs sandboxed and must be a single bundled file — check that{' '}
        <code>dist/preload/index.js</code> exists and contains no relative{' '}
        <code>require()</code> calls.
      </p>
    </div>
  );
} else {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <HashRouter>
          <App />
        </HashRouter>
      </QueryClientProvider>
    </StrictMode>
  );
}
