/** Onboarding på 3 skærme: vælg stack, vælg metode, sæt dagligt mål. */
import { useState } from 'react';
import { PlayingCard } from '../../components/PlayingCard';
import { Segmented } from '../../components/ui';
import { MNEMONICA } from '../../data/stacks';
import { useT } from '../../i18n';
import { sfx } from '../../lib/feedback';
import { navigate } from '../../lib/router';
import { actions, isComplete, useApp } from '../../store/store';
import type { Method } from '../../store/types';

export function Onboarding() {
  const t = useT();
  const state = useApp();
  const s = state.settings;
  const [step, setStep] = useState(0);
  const [custom, setCustom] = useState(false);

  const finish = () => {
    sfx.success();
    actions.setSettings({ onboarded: true });
    navigate(custom ? '/library/new' : '/', true);
  };

  const methods: { id: Method; icon: string; title: string; desc: string }[] = [
    { id: 'images', icon: '🖼️', title: t('methodImages'), desc: t('methodImagesDesc') },
    { id: 'palace', icon: '🏛️', title: t('methodPalace'), desc: t('methodPalaceDesc') },
    { id: 'rote', icon: '🔁', title: t('methodRote'), desc: t('methodRoteDesc') },
  ];

  return (
    <div className="onb">
      <div className="spread">
        <Segmented value={s.lang} onChange={(v) => actions.setSettings({ lang: v })} options={[{ value: 'da', label: 'DA' }, { value: 'en', label: 'EN' }]} />
        {step < 2 && <button className="btn ghost sm" onClick={finish}>{t('skip')}</button>}
      </div>

      <div className="onb-body" key={step}>
        {step === 0 && (
          <>
            <div className="fan" aria-hidden="true">
              {MNEMONICA.slice(0, 5).map((c, i) => (
                <span key={c} style={{ transform: `rotate(${(i - 2) * 12}deg)`, transition: 'transform .6s' }}><PlayingCard card={c} width={96} /></span>
              ))}
            </div>
            <h1 className="display center" style={{ fontSize: '2rem' }}>{t('onbWelcome')}</h1>
            <p className="center muted">{t('onbWelcomeText')}</p>
            <div className="section-title">{t('onbChooseStack')}</div>
            {state.stacks.filter(isComplete).map((st) => (
              <button key={st.id} className={`choice ${!custom && state.activeStackId === st.id ? 'on' : ''}`} onClick={() => { setCustom(false); actions.setActiveStack(st.id); }}>
                <span className="c-icon">🃏</span>
                <span className="navrow-text"><b>{st.name}</b><small>{st.author}</small></span>
              </button>
            ))}
            <button className={`choice ${custom ? 'on' : ''}`} onClick={() => setCustom(true)}>
              <span className="c-icon">✏️</span>
              <span className="navrow-text"><b>{t('onbOtherStack')}</b><small>{t('onbOtherStackDesc')}</small></span>
            </button>
          </>
        )}
        {step === 1 && (
          <>
            <h1 className="display" style={{ fontSize: '1.8rem' }}>{t('onbMethod')}</h1>
            <p className="muted">{t('onbMethodText')}</p>
            {methods.map((m) => (
              <button key={m.id} className={`choice ${s.method === m.id ? 'on' : ''}`} onClick={() => actions.setSettings({ method: m.id })}>
                <span className="c-icon">{m.icon}</span>
                <span className="navrow-text"><b>{m.title}</b><small>{m.desc}</small></span>
              </button>
            ))}
          </>
        )}
        {step === 2 && (
          <>
            <h1 className="display" style={{ fontSize: '1.8rem' }}>{t('onbGoal')}</h1>
            <p className="muted">{t('onbGoalText')}</p>
            {[{ g: 20, n: 3, k: 'goalRelaxed' }, { g: 40, n: 5, k: 'goalSteady' }, { g: 80, n: 8, k: 'goalIntense' }].map((o) => (
              <button key={o.g} className={`choice ${s.dailyGoal === o.g ? 'on' : ''}`} onClick={() => actions.setSettings({ dailyGoal: o.g, newPerDay: o.n })}>
                <span className="c-icon">{o.g === 20 ? '🌱' : o.g === 40 ? '🎯' : '🔥'}</span>
                <span className="navrow-text"><b>{t(o.k as 'goalRelaxed')}</b><small>{t('goalDesc', { g: o.g, n: o.n, d: Math.ceil(52 / o.n) })}</small></span>
              </button>
            ))}
          </>
        )}
      </div>

      <div className="onb-dots">{[0, 1, 2].map((i) => <span key={i} className={i === step ? 'on' : ''} />)}</div>
      <div className="btn-row">
        {step > 0 && <button className="btn" onClick={() => setStep(step - 1)}>{t('back')}</button>}
        <button className="btn primary big" onClick={() => (step < 2 ? (sfx.tap(), setStep(step + 1)) : finish())}>
          {step < 2 ? t('next') : t('letsGo')}
        </button>
      </div>
    </div>
  );
}
