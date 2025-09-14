import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { App } from './ui/App';
// Using relative path instead of alias due to Vite alias resolution issue observed at runtime.
import { store } from './store/store';
import { hydrateMissions } from './store/missionsSlice';
import { generateSimpleMissions } from './domain/missions/generator';

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  // Hydrate missions if empty
  const state = store.getState();
  if (Object.keys(state.missions.catalog).length === 0) {
    store.dispatch(hydrateMissions(generateSimpleMissions(5)));
  }
  root.render(
    <Provider store={store}>
      <App />
    </Provider>,
  );
}
