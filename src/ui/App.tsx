import React from 'react';
import './registerPanes';
import { listPanes } from './paneRegistry';

export function App() {
  const panes = listPanes();
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '8px',
        padding: '8px',
      }}
    >
      {panes.map((p) => {
        const Comp = p.component;
        return (
          <div key={p.id} style={{ gridColumn: `span ${p.defaultLayout.w}` }}>
            <div style={{ border: '1px solid #444', borderRadius: 4, padding: 8 }}>
              <h3 style={{ marginTop: 0 }}>{p.title}</h3>
              <Comp />
            </div>
          </div>
        );
      })}
    </div>
  );
}
