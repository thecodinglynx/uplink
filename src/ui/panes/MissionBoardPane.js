import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { startSession } from '../../store/sessionSlice';
import { setActiveMission } from '../../store/missionsSlice';
export function MissionBoardPane() {
    const dispatch = useDispatch();
    const missions = useSelector((s) => Object.values(s.missions.catalog));
    const activeId = useSelector((s) => s.missions.activeMissionId);
    const [selected, setSelected] = useState(activeId);
    const [seed, setSeed] = useState(String(Date.now() % 100000));
    const choose = (id) => {
        setSelected(id);
        dispatch(setActiveMission(id));
    };
    const handleStart = () => {
        if (!selected)
            return;
        const numericSeed = Number(seed) || 0;
        dispatch(startSession({ missionId: selected, seed: numericSeed }));
    };
    return (_jsxs("section", { "data-pane": "mission-board", role: "region", "aria-labelledby": "mission-board-heading", children: [_jsx("h2", { id: "mission-board-heading", children: "Mission Board" }), missions.length === 0 && _jsx("p", { children: "No missions loaded." }), _jsxs("div", { style: { marginBottom: 8 }, children: [_jsxs("label", { children: ["Seed:", ' ', _jsx("input", { "aria-label": "session seed", value: seed, onChange: (e) => setSeed(e.target.value), style: { width: 100 } })] }), _jsx("button", { type: "button", onClick: () => setSeed(String(Date.now() % 100000)), style: { marginLeft: 4 }, children: "Randomize" })] }), _jsx("ul", { "aria-label": "available missions", style: { listStyle: 'none', padding: 0 }, children: missions.map((m) => {
                    const avgPayout = Math.round((m.basePayoutRange[0] + m.basePayoutRange[1]) / 2);
                    return (_jsx("li", { style: { marginBottom: 4 }, children: _jsxs("button", { onClick: () => choose(m.id), style: {
                                fontWeight: selected === m.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                display: 'block',
                            }, "aria-pressed": selected === m.id, children: [m.title, " [", m.difficultyBand, "] \u2013 est avg ", avgPayout, " cr"] }) }, m.id));
                }) }), _jsx("button", { onClick: handleStart, disabled: !selected, children: "Start Session" })] }));
}
