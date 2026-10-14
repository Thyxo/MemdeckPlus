/** Træn-fanen: dagens kø, øvelser og træningsindstillinger. */
import { useMemo, useState } from 'react';
import { Icon } from '../../components/Icon';
import { StackSelect, useActive } from '../../components/StackSelect';
import { EmptyState, Page, Segmented, Sheet, Stepper, TopBar } from '../../components/ui';
import { useT } from '../../i18n';
import { buildDailyQueue, dueCount, weakCards } from '../../lib/srs';
import { navigate } from '../../lib/router';
import { actions } from '../../store/store';
import { dirsFor } from './modes';

export function TrainHub() {
  const t = useT();
  const { state, stack, order, complete, srs } = useActive();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const s = state.settings;
  const dirs = useMemo(() => dirsFor(s.direction), [s.direction]);
  const due = useMemo(() => dueCount(order, srs, dirs), [order, srs, dirs]);
  const queueLen = useMemo(() => buildDailyQueue(order, srs, { dirs, size: s.sessionSize, newLimit: s.newPerDay }).length, [order, srs, dirs, s.sessionSize, s.newPerDay]);
  const weak = useMemo(() => weakCards(srs, order).length, [srs, order]);
  const hs = state.highscores[stack.id] ?? {};

  const MODES = [
    { id: 'c2p', icon: '🔢', title: t('modeC2P'), desc: t('modeC2PDesc') },
    { id: 'p2c', icon: '🃏', title: t('modeP2C'), desc: t('modeP2CDesc') },
    { id: 'next', icon: '⏭️', title: t('modeNext'), desc: t('modeNextDesc') },
    { id: 'speed', icon: '⚡', title: t('modeSpeed'), desc: hs.speed ? t('highscoreN', { n: hs.speed }) : t('modeSpeedDesc') },
    { id: 'range', icon: '📏', title: t('modeRange'), desc: t('modeRangeDesc') },
    { id: 'full', icon: '🧠', title: t('modeFull'), desc: hs.fullOrderMs ? t('bestTime', { s: (hs.fullOrderMs / 1000).toFixed(0) }) : t('modeFullDesc') },
    { id: 'weak', icon: '🎯', title: t('modeWeak'), desc: weak ? t('weakCount', { n: weak }) : t('modeWeakDesc') },
  ];

  return (
    <>
      <TopBar title={t('tabTrain')} right={<button className="icon-btn" onClick={() => setSettingsOpen(true)} aria-label={t('trainSettings')}><Icon name="settings" /></button>} />
      <Page>
        <StackSelect />
        {!complete ? (
          <EmptyState icon="library" title={t('stackIncompleteTitle')} text={t('stackIncompleteText')}
            action={<button className="btn primary" onClick={() => navigate(`/library/${stack.id}`)}>{t('completeStack')}</button>} />
        ) : (
          <>
            <button className="card hero gap-top" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => navigate('/train/daily')}>
              <div className="spread">
                <div>
                  <small>{t('dailyTraining')}</small>
                  <h2 className="display" style={{ fontSize: '1.5rem', margin: '4px 0' }}>{queueLen ? t('nQuestions', { n: queueLen }) : t('allDone')}</h2>
                  <small>{t('dueAndNew', { due, n: s.newPerDay })}</small>
                </div>
                <span className="btn primary" style={{ pointerEvents: 'none' }}><Icon name="play" size={18} /> {t('start')}</span>
              </div>
            </button>

            <div className="section-title">{t('exercises')}</div>
            <div className="mode-grid">
              {MODES.map((m) => (
                <button key={m.id} className="mode-tile" onClick={() => navigate(`/train/${m.id}`)}>
                  <span className="mt-icon">{m.icon}</span>
                  <b>{m.title}</b>
                  <small className="muted">{m.desc}</small>
                </button>
              ))}
            </div>

            <div className="section-title">{t('settings')}</div>
            <div className="card flat">
              <div className="row"><span>{t('direction')}</span><b>{t(s.direction === 'c2p' ? 'dirC2P' : s.direction === 'p2c' ? 'dirP2C' : 'dirBoth')}</b></div>
              <div className="row"><span>{t('perQuestion')}</span><b>{s.timePerQuestion ? `${s.timePerQuestion} s` : t('noLimit')}</b></div>
              <div className="row"><span>{t('sessionSize')}</span><b>{s.sessionSize}</b></div>
              <button className="btn block gap-top" onClick={() => setSettingsOpen(true)}><Icon name="settings" size={18} /> {t('change')}</button>
            </div>
          </>
        )}
      </Page>
      <TrainSettingsSheet open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}

export function TrainSettingsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { state } = useActive();
  const s = state.settings;
  return (
    <Sheet open={open} onClose={onClose} title={t('trainSettings')} footer={<button className="btn primary" onClick={onClose}>{t('done')}</button>}>
      <div className="stack-v">
        <div className="field">{t('direction')}
          <Segmented value={s.direction} onChange={(v) => actions.setSettings({ direction: v })} options={[
            { value: 'c2p', label: t('dirC2PShort') }, { value: 'p2c', label: t('dirP2CShort') }, { value: 'both', label: t('dirBothShort') },
          ]} />
        </div>
        <div className="field">{t('perQuestion')}
          <Segmented value={s.timePerQuestion} onChange={(v) => actions.setSettings({ timePerQuestion: v })} options={[
            { value: 0, label: t('off') }, { value: 5, label: '5 s' }, { value: 10, label: '10 s' }, { value: 20, label: '20 s' },
          ]} />
        </div>
        <div className="row"><span>{t('sessionSize')}</span><Stepper value={s.sessionSize} min={5} max={104} step={5} onChange={(v) => actions.setSettings({ sessionSize: v })} /></div>
        <div className="row"><span className="row-text"><span>{t('newPerDay')}</span><small>{t('newPerDayDesc')}</small></span><Stepper value={s.newPerDay} min={0} max={52} onChange={(v) => actions.setSettings({ newPerDay: v })} /></div>
      </div>
    </Sheet>
  );
}
