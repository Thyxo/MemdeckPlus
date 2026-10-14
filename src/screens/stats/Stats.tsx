/** Statistik: varmekort 4×13, svagheder, svartid, streak-kalender, fremgangsgrafer og badges. */
import { useMemo, useState } from 'react';
import { StackSelect, useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { Page, Sheet, TopBar } from '../../components/ui';
import { RANKS, SUITS, type CardId, rankLabel } from '../../data/cards';
import { SuitIcon } from '../../components/SuitIcon';
import { tk, useT } from '../../i18n';
import { addDays, computeStreak, longestStreak, parseYmd, ymd } from '../../lib/date';
import { cardStats, isMastered, stackMastery, weakCards } from '../../lib/srs';
import { navigate } from '../../lib/router';
import { BADGES } from '../../store/badges';
import { activeDays } from '../../store/store';

/** Farve fra rød (svag) over gul til grøn (stærk); grå når ikke set. */
function heatColor(strength: number, seen: boolean) {
  if (!seen) return 'var(--ring-track)';
  const h = Math.round(strength * 130);
  return `hsl(${h} 65% 50%)`;
}

export function Stats() {
  const t = useT();
  const { state, stack, order, srs, posOf } = useActive();
  const [sel, setSel] = useState<CardId | null>(null);
  const lang = state.settings.danishRanks ? 'da' : 'en';
  const days = activeDays(state);
  const streak = computeStreak(days);
  const best = longestStreak(days);
  const mastery = stackMastery(srs, order);
  const mastered = order.filter((c) => isMastered(srs, c)).length;
  const weak = useMemo(() => weakCards(srs, order, 8), [srs, order]);

  const totals = Object.values(state.days).reduce((a, d) => ({ answers: a.answers + d.answers, correct: a.correct + d.correct, ms: a.ms + d.ms }), { answers: 0, correct: 0, ms: 0 });
  const avgMs = totals.answers ? totals.ms / totals.answers : 0;
  const acc = totals.answers ? Math.round((totals.correct / totals.answers) * 100) : 0;

  // Sidste 30 dage til grafer
  const last30 = Array.from({ length: 30 }, (_, i) => addDays(ymd(), i - 29));
  let lastM = 0;
  const masterySeries = last30.map((d) => {
    const m = state.days[d]?.mastery?.[stack.id];
    if (m !== undefined) lastM = m;
    return lastM;
  });
  const answersSeries = last30.map((d) => state.days[d]?.answers ?? 0);
  const maxA = Math.max(10, ...answersSeries);

  // Kalender: 18 uger
  const weeks = 18;
  const today = ymd();
  const startDay = (() => { const d = parseYmd(addDays(today, -(weeks * 7 - 1))); const dow = (d.getDay() + 6) % 7; return addDays(ymd(d), -dow); })();
  const calDays = Array.from({ length: weeks * 7 }, (_, i) => addDays(startDay, i)).filter((d) => d <= today);

  const s = sel ? cardStats(srs, sel) : null;

  return (
    <>
      <TopBar title={t('stats')} backTo="/" />
      <Page>
        <StackSelect compact />
        <div className="kpis gap-top">
          <div className="kpi"><b className="gold">{mastery}%</b><small className="muted">{t('mastery')}</small></div>
          <div className="kpi"><b>{mastered}/52</b><small className="muted">{t('learnedCards')}</small></div>
          <div className="kpi"><b>🔥 {streak}</b><small className="muted">{t('streakDays')}</small></div>
          <div className="kpi"><b>{acc}%</b><small className="muted">{t('accuracy')}</small></div>
          <div className="kpi"><b>{(avgMs / 1000).toFixed(1)}s</b><small className="muted">{t('avgTime')}</small></div>
          <div className="kpi"><b>{totals.answers}</b><small className="muted">{t('totalAnswers')}</small></div>
        </div>

        <div className="section-title">{t('heatmap')}</div>
        <div className="card flat">
          <div className="heatmap" role="grid" aria-label={t('heatmap')}>
            <span />
            {RANKS.map((r) => <span key={r} className="hm-label">{rankLabel(r, lang)}</span>)}
            {SUITS.map((su) => (
              <div key={su} style={{ display: 'contents' }} role="row">
                <span className="hm-label"><SuitIcon suit={su} size={16} /></span>
                {RANKS.map((r) => {
                  const c = `${r}${su}` as CardId;
                  const st = cardStats(srs, c);
                  return (
                    <button key={c} className="hm-cell" style={{ background: heatColor(st.strength, st.seen > 0) }} onClick={() => setSel(c)}
                      aria-label={`${c}: ${Math.round(st.strength * 100)}%`}>{posOf.get(c)}</button>
                  );
                })}
              </div>
            ))}
          </div>
          <div className="spread" style={{ marginTop: 8, fontSize: '.75rem' }}>
            <span className="muted">{t('heatLegendWeak')}</span>
            <span style={{ flex: 1, height: 6, margin: '0 8px', borderRadius: 3, background: 'linear-gradient(90deg,hsl(0 65% 50%),hsl(65 65% 50%),hsl(130 65% 50%))' }} />
            <span className="muted">{t('heatLegendStrong')}</span>
          </div>
        </div>

        <div className="section-title">{t('weaknesses')}</div>
        <div className="card flat">
          {weak.length === 0 ? <p className="muted" style={{ margin: 0 }}>{t('noWeakYet')}</p> : (
            <>
              <table className="table">
                <thead><tr><th>{t('card')}</th><th>#</th><th>{t('errors')}</th><th>{t('time')}</th></tr></thead>
                <tbody>{weak.map((w) => (
                  <tr key={w.card} onClick={() => setSel(w.card)} style={{ cursor: 'pointer' }}>
                    <td><CardChip card={w.card} size="sm" /></td><td>{posOf.get(w.card)}</td>
                    <td className="bad">{Math.round(w.errorRate * 100)}%</td><td>{(w.avgMs / 1000).toFixed(1)}s</td>
                  </tr>
                ))}</tbody>
              </table>
              <button className="btn primary block gap-top" onClick={() => navigate('/train/weak')}>🎯 {t('modeWeak')}</button>
            </>
          )}
        </div>

        <div className="section-title">{t('progress30')}</div>
        <div className="card flat">
          <svg className="chart" viewBox="0 0 300 120" role="img" aria-label={t('progress30')}>
            {[0, 50, 100].map((g) => <line key={g} x1="24" x2="296" y1={100 - g * 0.9} y2={100 - g * 0.9} stroke="var(--line-2)" />)}
            {[0, 50, 100].map((g) => <text key={g} x="20" y={104 - g * 0.9} textAnchor="end">{g}%</text>)}
            {answersSeries.map((a, i) => <rect key={i} x={26 + i * 9} y={100 - (a / maxA) * 90} width="6" height={(a / maxA) * 90} rx="2" fill="var(--ok)" opacity=".35" />)}
            <polyline fill="none" stroke="var(--gold)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"
              points={masterySeries.map((m, i) => `${29 + i * 9},${100 - m * 0.9}`).join(' ')} />
            <text x="26" y="116">{t('daysAgo', { n: 30 })}</text>
            <text x="296" y="116" textAnchor="end">{t('today')}</text>
          </svg>
          <div className="stack-h" style={{ fontSize: '.75rem' }}>
            <span><span style={{ display: 'inline-block', width: 12, height: 3, background: 'var(--gold)', verticalAlign: 'middle' }} /> {t('mastery')}</span>
            <span><span style={{ display: 'inline-block', width: 10, height: 10, background: 'var(--ok)', opacity: .35, verticalAlign: 'middle' }} /> {t('answersPerDay')}</span>
          </div>
        </div>

        <div className="section-title">{t('streakCalendar')}</div>
        <div className="card flat">
          <div className="cal" aria-label={t('streakCalendar')}>
            {calDays.map((d) => {
              const a = state.days[d]?.answers ?? 0;
              const lvl = a === 0 ? '' : a < state.settings.dailyGoal / 2 ? 'l1' : a < state.settings.dailyGoal ? 'l2' : 'l3';
              return <span key={d} className={`${lvl} ${d === today ? 'today' : ''}`} title={`${d}: ${a}`} />;
            })}
          </div>
          <small className="muted">{t('streakInfo', { n: streak, b: best })}</small>
        </div>

        <div className="section-title">{t('badges')}</div>
        <div className="badge-grid">
          {BADGES.map((b) => {
            const won = state.badges[b.id];
            return (
              <div key={b.id} className={`badge ${won ? 'won' : ''}`}>
                <div className="b-icon">{b.icon}</div>
                <b>{tk(t, 'badge.' + b.id)}</b>
                <small className="muted">{won ? new Date(won).toLocaleDateString() : tk(t, 'badgeDesc.' + b.id)}</small>
              </div>
            );
          })}
        </div>
      </Page>

      <Sheet open={!!sel} onClose={() => setSel(null)} title={sel ? `${t('card')} #${posOf.get(sel)}` : ''}>
        {sel && s && (
          <div className="stack-v">
            <div className="center"><CardChip card={sel} size="lg" /></div>
            <div className="kpis">
              <div className="kpi"><b>{Math.round(s.strength * 100)}%</b><small className="muted">{t('strength')}</small></div>
              <div className="kpi"><b>{s.correct}/{s.seen}</b><small className="muted">{t('correctShort')}</small></div>
              <div className="kpi"><b>{(s.avgMs / 1000).toFixed(1)}s</b><small className="muted">{t('avgTime')}</small></div>
            </div>
            <table className="table">
              <thead><tr><th>{t('direction')}</th><th>{t('box')}</th><th>{t('nextReview')}</th></tr></thead>
              <tbody>{(['c2p', 'p2c', 'nx'] as const).map((d) => {
                const it = srs[`${sel}|${d}`];
                return <tr key={d}><td>{t(d === 'c2p' ? 'dirC2PShort' : d === 'p2c' ? 'dirP2CShort' : 'modeNext')}</td><td>{it?.box ?? 0}/5</td><td>{it?.box ? it.due : '—'}</td></tr>;
              })}</tbody>
            </table>
          </div>
        )}
      </Sheet>
    </>
  );
}
