import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import './registerPanes';
import { listPanes } from './paneRegistry';
export function App() {
    const panes = listPanes();
    return (_jsx("div", { style: {
            display: 'grid',
            gridTemplateColumns: 'repeat(12, 1fr)',
            gap: '8px',
            padding: '8px',
        }, children: panes.map((p) => {
            const Comp = p.component;
            return (_jsx("div", { style: { gridColumn: `span ${p.defaultLayout.w}` }, children: _jsxs("div", { style: { border: '1px solid #444', borderRadius: 4, padding: 8 }, children: [_jsx("h3", { style: { marginTop: 0 }, children: p.title }), _jsx(Comp, {})] }) }, p.id));
        }) }));
}
