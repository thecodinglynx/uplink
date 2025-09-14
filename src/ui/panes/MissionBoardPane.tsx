import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startSession } from '../../store/sessionSlice';
import { setActiveMission } from '../../store/missionsSlice';
import type { RootState } from '../../store/store';

export function MissionBoardPane() {
  const dispatch = useDispatch();
  const missions = useSelector((s: RootState) => Object.values(s.missions.catalog));
  const activeId = useSelector((s: RootState) => s.missions.activeMissionId);
  const [selected, setSelected] = useState<string | undefined>(activeId);
  const [seed, setSeed] = useState<string>(String(Date.now() % 100000));

  const choose = (id: string) => {
    setSelected(id);
    dispatch(setActiveMission(id as any));
  };
  const handleStart = () => {
    if (!selected) return;
    const numericSeed = Number(seed) || 0;
    dispatch(startSession({ missionId: selected as any, seed: numericSeed }));
  };
  return (
    <section data-pane="mission-board" role="region" aria-labelledby="mission-board-heading">
      <h2 id="mission-board-heading">Mission Board</h2>
      {missions.length === 0 && <p>No missions loaded.</p>}
      <div style={{ marginBottom: 8 }}>
        <label>
          Seed:{' '}
          <input
            aria-label="session seed"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            style={{ width: 100 }}
          />
        </label>
        <button
          type="button"
          onClick={() => setSeed(String(Date.now() % 100000))}
          style={{ marginLeft: 4 }}
        >
          Randomize
        </button>
      </div>
      <ul aria-label="available missions" style={{ listStyle: 'none', padding: 0 }}>
        {missions.map((m) => {
          const avgPayout = Math.round((m.basePayoutRange[0] + m.basePayoutRange[1]) / 2);
          return (
            <li key={m.id} style={{ marginBottom: 4 }}>
              <button
                onClick={() => choose(m.id)}
                style={{
                  fontWeight: selected === m.id ? 'bold' : 'normal',
                  cursor: 'pointer',
                  display: 'block',
                }}
                aria-pressed={selected === m.id}
              >
                {m.title} [{m.difficultyBand}] – est avg {avgPayout} cr
              </button>
            </li>
          );
        })}
      </ul>
      <button onClick={handleStart} disabled={!selected}>
        Start Session
      </button>
    </section>
  );
}
