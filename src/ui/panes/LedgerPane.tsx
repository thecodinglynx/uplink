import React from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../store/store';

export function LedgerPane() {
  const credits = useSelector((s: RootState) => s.ledger.profile.credits);
  const tx = useSelector((s: RootState) => s.ledger.ledger.transactions)
    .slice(-5)
    .reverse();
  return (
    <section data-pane="ledger" role="region" aria-labelledby="ledger-heading">
      <h2 id="ledger-heading">Ledger</h2>
      <div>Credits: {credits}</div>
      <ul aria-label="recent transactions">
        {tx.map((t) => (
          <li key={t.id}>
            {t.reason}: {t.amount > 0 ? '+' : ''}
            {t.amount}
          </li>
        ))}
        {tx.length === 0 && <li>No transactions</li>}
      </ul>
    </section>
  );
}
