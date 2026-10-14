/** Opsummering efter en session: score, svartid, fejl og "træn fejlene igen". */
import { Icon } from '../../components/Icon';
import { CardChip } from '../../components/PlayingCard';
import { Page, ProgressRing, TopBar } from '../../components/ui';
import { useT } from '../../i18n';
import { navigate } from '../../lib/router';
import { useApp } from '../../store/store';
import type { QItem, QuizResult } from './Quiz';

export function Summary({ title, mode, result, stackId, onAgain, onRetryWrong }: {
  title: string; mode: string; result: QuizResult; stackId: string; onAgain: () => void; onRetryWrong: (items: QItem[]) => void;
}) {
  const t = useT();
  const state = useApp();
  const total = result.answers.length;
  const correct = result.answers.filter((a) => a.correct).length;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const avg = total ? result.answers.reduce((a, x) => a + x.ms, 0) / total / 1000 : 0;
  const wrong = result.answers.filter((a) => !a.correct);
  const hs = state.highscores[stackId];

  return (
    <>
      <TopBar title={title} backTo="/train" />
      <Page>
        <div className="card hero center stack-v" style={{ alignItems: 'center' }}>
          <ProgressRing value={pct} size={140}>
            <div><b style={{ fontSize: '2rem' }}>{mode === 'speed' ? correct : `${pct}%`}</b><br /><small>{mode === 'speed' ? t('correctIn60') : t('nOfM', { n: correct, m: total })}</small></div>
          </ProgressRing>
          <h2 className="display">{pct === 100 ? t('perfect') : pct >= 80 ? t('greatJob') : pct >= 50 ? t('goodProgress') : t('keepGoing')}</h2>
          {mode === 'speed' && hs?.speed !== undefined && <span className="pill gold">🏆 {t('highscoreN', { n: hs.speed })}</span>}
        </div>

        <div className="kpis gap-top">
          <div className="kpi"><b>{correct}</b><small className="muted">{t('correctShort')}</small></div>
          <div className="kpi"><b>{total - correct}</b><small className="muted">{t('wrongShort')}</small></div>
          <div className="kpi"><b>{avg.toFixed(1)}s</b><small className="muted">{t('avgTime')}</small></div>
        </div>

        {wrong.length > 0 && (
          <>
            <div className="section-title">{t('mistakes')}</div>
            <div className="card flat">
              <table className="table">
                <thead><tr><th>{t('question')}</th><th>{t('yourAnswer')}</th><th>{t('correctAnswer')}</th></tr></thead>
                <tbody>
                  {wrong.map((a, i) => (
                    <tr key={i}>
                      <td>{a.item.dir === 'p2c' ? <b>#{a.item.pos}</b> : <span className="stack-h" style={{ gap: 4 }}>{a.item.dir === 'nx' && (a.item.prev ? '←' : '→')}<CardChip card={a.item.card} size="sm" /></span>}</td>
                      <td className="bad">{a.given}</td>
                      <td className="ok"><b>{a.expected}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="stack-v gap-top">
          {wrong.length > 0 && mode !== 'speed' && (
            <button className="btn primary block" onClick={() => onRetryWrong(wrong.map((a) => a.item))}><Icon name="undo" size={18} /> {t('retryWrong', { n: wrong.length })}</button>
          )}
          <button className={`btn block ${wrong.length && mode !== 'speed' ? '' : 'primary'}`} onClick={onAgain}><Icon name="play" size={18} /> {t('again')}</button>
          <button className="btn ghost block" onClick={() => navigate('/train', true)}>{t('done')}</button>
        </div>
      </Page>
    </>
  );
}
