/** App-skal: tema, routing, bundnavigation, toasts, badges/konfetti, onboarding og PWA-opdatering. */
import { useEffect, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { Icon, type IconName } from './components/Icon';
import { DialogHost } from './components/ui';
import { tk, useT } from './i18n';
import { fireConfetti } from './lib/confetti';
import { sfx } from './lib/feedback';
import { maybeRemind } from './lib/reminders';
import { navigate, useRoute } from './lib/router';
import { BADGES } from './store/badges';
import { on, useApp } from './store/store';
import { Home } from './screens/home/Home';
import { LibraryList } from './screens/library/LibraryList';
import { StackEditor } from './screens/library/StackEditor';
import { NewStack } from './screens/library/NewStack';
import { TrainHub } from './screens/train/TrainHub';
import { TrainSession } from './screens/train/TrainSession';
import { LearnHub } from './screens/learn/LearnHub';
import { BuildStack } from './screens/learn/BuildStack';
import { ImagesScreen } from './screens/learn/ImagesScreen';
import { Palaces } from './screens/learn/Palaces';
import { PalaceEditor } from './screens/learn/PalaceEditor';
import { Patterns } from './screens/learn/Patterns';
import { ToolsHub } from './screens/tools/ToolsHub';
import { SetupDeck } from './screens/tools/SetupDeck';
import { CheckDeck } from './screens/tools/CheckDeck';
import { Lookup } from './screens/tools/Lookup';
import { CutCalc } from './screens/tools/CutCalc';
import { NameEffect } from './screens/tools/NameEffect';
import { CountCards } from './screens/tools/CountCards';
import { Acaan } from './screens/tools/Acaan';
import { CheatSheets } from './screens/tools/CheatSheets';
import { Stats } from './screens/stats/Stats';
import { SettingsScreen } from './screens/settings/Settings';
import { Onboarding } from './screens/onboarding/Onboarding';

const TABS: { id: string; path: string; icon: IconName; label: 'tabHome' | 'tabLibrary' | 'tabLearn' | 'tabTrain' | 'tabTools' }[] = [
  { id: '', path: '/', icon: 'home', label: 'tabHome' },
  { id: 'library', path: '/library', icon: 'library', label: 'tabLibrary' },
  { id: 'learn', path: '/learn', icon: 'learn', label: 'tabLearn' },
  { id: 'train', path: '/train', icon: 'train', label: 'tabTrain' },
  { id: 'tools', path: '/tools', icon: 'tools', label: 'tabTools' },
];

function Screen({ parts }: { parts: string[] }) {
  const [a = '', b, c] = parts;
  switch (a) {
    case 'library':
      if (b === 'new') return <NewStack />;
      return b ? <StackEditor id={b} /> : <LibraryList />;
    case 'train':
      return b ? <TrainSession key={b + (c ?? '')} mode={b} /> : <TrainHub />;
    case 'learn':
      if (b === 'build') return <BuildStack />;
      if (b === 'images') return <ImagesScreen />;
      if (b === 'patterns') return <Patterns />;
      if (b === 'palace') return c ? <PalaceEditor id={c} /> : <Palaces />;
      return <LearnHub />;
    case 'tools':
      switch (b) {
        case 'setup': return <SetupDeck />;
        case 'check': return <CheckDeck />;
        case 'lookup': return <Lookup />;
        case 'cut': return <CutCalc />;
        case 'name': return <NameEffect />;
        case 'count': return <CountCards />;
        case 'acaan': return <Acaan />;
        case 'sheets': return <CheatSheets />;
        default: return <ToolsHub />;
      }
    case 'stats':
      return <Stats />;
    case 'settings':
      return <SettingsScreen />;
    default:
      return <Home />;
  }
}

interface ToastMsg { id: number; text: string; icon?: string; action?: { label: string; run: () => void } }

export function App() {
  const state = useApp();
  const t = useT();
  const { parts } = useRoute();
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const { theme, lang } = state.settings;

  // Tema (inkl. "system")
  useEffect(() => {
    const apply = () => {
      const resolved = theme === 'system' ? (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : theme;
      document.documentElement.dataset.theme = resolved;
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', resolved === 'light' ? '#f4f0e6' : '#0b1d17');
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: light)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [theme]);

  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  // Toasts, badges og konfetti
  useEffect(() => {
    const push = (m: Omit<ToastMsg, 'id'>, ms = 3200) => {
      const id = Date.now() + Math.random();
      setToasts((x) => [...x, { ...m, id }]);
      window.setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), ms);
    };
    const offs = [
      on('toast', (key) => push({ text: tk(t, key) })),
      on('badge', (id) => {
        const b = BADGES.find((x) => x.id === id);
        sfx.success();
        push({ icon: b?.icon, text: `${t('badgeUnlocked')}: ${tk(t, 'badge.' + id)}` }, 4500);
      }),
      on('confetti', () => fireConfetti()),
    ];
    return () => offs.forEach((o) => o());
  }, [t]);

  // PWA: service worker + "ny version"-besked
  useEffect(() => {
    const update = registerSW({
      onNeedRefresh() {
        const id = Date.now();
        setToasts((x) => [...x, { id, text: t('updateAvailable'), action: { label: t('update'), run: () => update(true) } }]);
      },
      onOfflineReady() {
        const id = Date.now();
        setToasts((x) => [...x, { id, icon: '✅', text: t('offlineReady') }]);
        window.setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 3500);
      },
    });
  }, []); // registreres én gang

  // Påmindelser (Notification API) – tjekkes ved start og når appen kommer i forgrunden
  useEffect(() => {
    maybeRemind();
    const vis = () => document.visibilityState === 'visible' && maybeRemind();
    document.addEventListener('visibilitychange', vis);
    const iv = window.setInterval(maybeRemind, 60_000);
    return () => { document.removeEventListener('visibilitychange', vis); window.clearInterval(iv); };
  }, []);

  if (!state.settings.onboarded) return (<><Onboarding /><DialogHost /></>);

  const top = parts[0] ?? '';
  const hideNav = (top === 'train' && !!parts[1]) || (top === 'tools' && ['setup', 'lookup'].includes(parts[1] ?? ''));
  const activeTab = TABS.find((x) => x.id === top)?.id ?? (top === 'stats' || top === 'settings' ? '' : '');

  return (
    <div className="app">
      <Screen parts={parts} />
      {!hideNav && (
        <nav className="bottomnav" aria-label={t('mainNav')}>
          {TABS.map((tab) => (
            <button key={tab.id} className={activeTab === tab.id ? 'on' : ''} aria-current={activeTab === tab.id ? 'page' : undefined}
              onClick={() => { sfx.tap(); navigate(tab.path); window.scrollTo({ top: 0 }); }}>
              <Icon name={tab.icon} size={24} />
              <span>{t(tab.label)}</span>
            </button>
          ))}
        </nav>
      )}
      <div className="toast-wrap" aria-live="polite">
        {toasts.map((m) => (
          <div key={m.id} className="toast">
            {m.icon && <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>}
            <span>{m.text}</span>
            {m.action && <button className="btn sm primary" onClick={m.action.run}>{m.action.label}</button>}
          </div>
        ))}
      </div>
      <DialogHost />
    </div>
  );
}
