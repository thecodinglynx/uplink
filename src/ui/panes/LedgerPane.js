import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSelector } from 'react-redux';
export function LedgerPane() {
    const credits = useSelector((s) => s.ledger.profile.credits);
    const tx = useSelector((s) => s.ledger.ledger.transactions)
        .slice(-5)
        .reverse();
    return (_jsxs("section", { "data-pane": "ledger", role: "region", "aria-labelledby": "ledger-heading", children: [_jsx("h2", { id: "ledger-heading", children: "Ledger" }), _jsxs("div", { children: ["Credits: ", credits] }), _jsxs("ul", { "aria-label": "recent transactions", children: [tx.map((t) => (_jsxs("li", { children: [t.reason, ": ", t.amount > 0 ? '+' : '', t.amount] }, t.id))), tx.length === 0 && _jsx("li", { children: "No transactions" })] })] }));
}
