import { registerPane } from './paneRegistry';
import { MissionBoardPane } from './panes/MissionBoardPane';
import { ActiveSessionPane } from './panes/ActiveSessionPane';
import { UpgradesPane } from './panes/UpgradesPane';
import { FactionsPane } from './panes/FactionsPane';
import { LedgerPane } from './panes/LedgerPane';
// Register core panes with minimal default layout approximations
registerPane({
    id: 'missionBoard',
    title: 'Mission Board',
    component: MissionBoardPane,
    defaultLayout: { x: 0, y: 0, w: 4, h: 3 },
});
registerPane({
    id: 'activeSession',
    title: 'Session',
    component: ActiveSessionPane,
    defaultLayout: { x: 4, y: 0, w: 4, h: 3 },
});
registerPane({
    id: 'upgrades',
    title: 'Upgrades',
    component: UpgradesPane,
    defaultLayout: { x: 8, y: 0, w: 4, h: 3 },
});
registerPane({
    id: 'factions',
    title: 'Factions',
    component: FactionsPane,
    defaultLayout: { x: 0, y: 3, w: 6, h: 3 },
});
registerPane({
    id: 'ledger',
    title: 'Ledger',
    component: LedgerPane,
    defaultLayout: { x: 6, y: 3, w: 6, h: 3 },
});
