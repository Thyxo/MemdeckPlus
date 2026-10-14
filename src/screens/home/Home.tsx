/** Hjem: aktiv stack, dagens træning (stor knap), streak, dagens mål og samlet beherskelse. */
import { useMemo } from 'react';
import { Icon } from '../../components/Icon';
import { StackSelect, useActive } from '../../components/StackSelect';
import { PlayingCard } from '../../components/PlayingCard';
import { Bar, NavRow, Page, ProgressRing } from '../../components/ui';
import { tk, useT } from '../../i18n';
import { computeStreak, ymd } from '../../lib/date';
import { buildDailyQueue, isMastered, stackMastery } from '../../lib/srs';
import { navigate } from '../../lib/router';
import { BADGES } from '../../store/badges';
import { activeDays } from '../../store/store';
import { dirsFor } from '../train/modes';

export function Home() {
  const t = useT();
  const { state, stack, order, complete, srs } = useActive();
  const s = state.settings;
  const today = state.days[ymd()];
  const done = today?.answers ?? 0;
  const goalPct = Math.min(100, (done / s.dailyGoal) * 100);
  const streak = computeStreak(activeDays(state));
  const mastery = stackMastery(srs, order);
  const mastered = order.filter((c) => isMastered(srs, c)).length;
  const queue = useMemo(() => complete ? buildDailyQueue(order, srs, { dirs: dirsFor(s.direction), size: s.sessionSize, newLimit: s.newPerDay }).length : 0,
    [complete, order, srs, s.direction, s.sessionSize, s.newPerDay]);
  const lastBadge = Object.entries(state.badges).sort((a, b) => b[1] - a[1])[0];
  const lp = state.learn[stack.id];
  const chunks = Math.ceil(52 / (lp?.chunkSize ?? 8));
  const hour = new Date().getHours();
  const greeting = hour < 10 ? t('goodMorning') : hour < 17 ? t('goodDay') : t('goodEvening');

  return (
    <>
      <header className="topbar" style={{ gridTemplateColumns: '1fr auto' }}>
        <div className="stack-h" style={{ gap: 8, paddingLeft: 8 }}>
          <svg width="28" height="28" viewBox="0 0 64 64" aria-hidden="true"><rect x="8" y="4" width="40" height="54" rx="6" fill="var(--gold)" transform="rotate(-10 28 31)" /><rect x="16" y="6" width="40" height="54" rx="6" fill="var(--surface)" stroke="var(--gold)" strokeWidth="3" /><path d="M36 16 C40 24 50 28 50 36 C50 41 46 44 42 44 C39 44 37 42 36 40 C36 44 38 47 41 49 L31 49 C34 47 36 44 36 40 C35 42 33 44 30 44 C26 44 22 41 22 36 C22 28 32 24 36 16Z" fill="var(--gold)" /></svg>
          <h1 className="display" style={{ fontSize: '1.35rem' }}>StackMaster</h1>
        </div>
        <div className="topbar-right">
          <button className="icon-btn" onClick={() => navigate('/stats')} aria-label={t('stats')}><Icon name="stats" /></button>
          <button className="icon-btn" onClick={() => navigate('/settings')} aria-label={t('settings')}><Icon name="settings" /></button>
        </div>
      </header>
      <Page>
        <StackSelect />

        <div className="card hero gap-top">
          <div className="spread" style={{ alignItems: 'flex-start' }}>
            <div>
              <small>{greeting}</small>
              <h2 className="display" style={{ fontSize: '1.6rem', margin: '2px 0 6px' }}>{t('dailyTraining')}</h2>
              <small>{complete ? (queue ? t('nQuestionsReady', { n: queue }) : t('allDone')) : t('stackIncompleteTitle')}</small>
            </div>
            <div style={{ position: 'relative', width: 90, height: 100 }} aria-hidden="true">
              <span style={{ position: 'absolute', right: 26, top: 6, transform: 'rotate(-12deg)' }}><PlayingCard card={order[0]} width={52} /></span>
              <span style={{ position: 'absolute', right: 0, top: 0, transform: 'rotate(8deg)' }}><PlayingCard faceDown width={52} /></span>
            </div>
          </div>
          <button className="btn primary block big gap-top" disabled={!complete}
            onClick={() => navigate(queue ? '/train/daily' : '/train/speed')}>
            <Icon name="play" /> {queue ? t('startTraining') : t('modeSpeed')}
          </button>
        </div>

        <div className="grid-2 gap-top">
          <div className="card center stack-v" style={{ alignItems: 'center' }}>
            <ProgressRing value={mastery} size={104} stroke={9}><div><b style={{ fontSize: '1.5rem' }}>{mastery}%</b><br /><small className="muted">{t('mastery')}</small></div></ProgressRing>
            <small className="muted">{t('learnedOf', { n: mastered })}</small>
          </div>
          <div className="stack-v">
            <div className="card" style={{ padding: 14 }}>
              <div className="spread"><small className="muted">{t('streak')}</small><Icon name="flame" size={18} className="gold" /></div>
              <b style={{ fontSize: '1.6rem' }}>{streak}</b> <small className="muted">{t('daysInRow')}</small>
            </div>
            <div className="card" style={{ padding: 14 }}>
              <div className="spread"><small className="muted">{t('dailyGoal')}</small><Icon name="target" size={18} className="gold" /></div>
              <b style={{ fontSize: '1.2rem' }}>{done}</b><small className="muted"> / {s.dailyGoal}</small>
              <div style={{ marginTop: 6 }}><Bar value={goalPct} tone={goalPct >= 100 ? 'green' : 'gold'} /></div>
            </div>
          </div>
        </div>

        <div className="section-title">{t('quickAccess')}</div>
        <div className="navlist">
          <NavRow icon="learn" title={t('buildTheStack')} desc={t('chunksPassed', { n: lp?.passed.length ?? 0, m: chunks })} onClick={() => navigate('/learn/build')} />
          <NavRow icon="eye" title={t('lookup')} desc={t('lookupDesc')} onClick={() => navigate('/tools/lookup')} />
          <NavRow icon="deck" title={t('setupDeck')} desc={t('setupDeckDesc')} onClick={() => navigate('/tools/setup')} />
          <NavRow icon="stats" title={t('stats')} desc={t('statsDesc')} onClick={() => navigate('/stats')} />
        </div>

        {lastBadge && (
          <>
            <div className="section-title">{t('latestBadge')}</div>
            <button className="navrow" onClick={() => navigate('/stats')}>
              <span className="navrow-icon">{BADGES.find((b) => b.id === lastBadge[0])?.icon}</span>
              <span className="navrow-text"><b>{tk(t, 'badge.' + lastBadge[0])}</b><small>{tk(t, 'badgeDesc.' + lastBadge[0])}</small></span>
            </button>
          </>
        )}
      </Page>
    </>
  );
}
