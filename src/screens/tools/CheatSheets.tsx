/** Cheat sheets: 1–52-tabel og 52-grid (kort → position). Print/PDF via browseren eller gem som PNG. */
import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { ImageThumb } from '../../components/CardImageView';
import { Page, Segmented, TopBar } from '../../components/ui';
import { RANKS, SUITS, type CardId, rankLabel } from '../../data/cards';
import { SuitIcon } from '../../components/SuitIcon';
import { useT } from '../../i18n';
import { renderGridPng, renderListPng } from '../../lib/cheatsheetImage';
import { downloadFile, safeFileName } from '../../lib/files';
import { emit } from '../../store/store';

export function CheatSheets() {
  const t = useT();
  const { state, stack, order, posOf } = useActive();
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [withImages, setWithImages] = useState(false);
  const [busy, setBusy] = useState(false);
  const danish = state.settings.danishRanks;

  const savePng = async () => {
    setBusy(true);
    try {
      const sub = `StackMaster · ${new Date().toLocaleDateString(state.settings.lang === 'da' ? 'da-DK' : 'en-GB')}`;
      const blob = view === 'list' ? await renderListPng(stack.name, order, danish, sub) : await renderGridPng(stack.name, order, danish, sub);
      downloadFile(`${safeFileName(stack.name)}-${view}.png`, blob, 'image/png');
    } catch {
      emit('toast', 'exportFailed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <TopBar title={t('cheatSheets')} backTo="/tools" />
      <Page className="wide">
        <div className="no-print stack-v">
          <Segmented value={view} onChange={setView} options={[{ value: 'list', label: t('sheetList') }, { value: 'grid', label: t('sheetGrid') }]} />
          {view === 'list' && (
            <label className="row toggle-row" style={{ minHeight: 44 }}>
              <span>{t('includeImages')}</span>
              <input type="checkbox" className="switch" checked={withImages} onChange={(e) => setWithImages(e.target.checked)} />
            </label>
          )}
          <div className="btn-row">
            <button className="btn" onClick={() => window.print()}><Icon name="print" size={18} /> {t('printPdf')}</button>
            <button className="btn primary" onClick={savePng} disabled={busy}><Icon name="download" size={18} /> {busy ? '…' : t('savePng')}</button>
          </div>
          <small className="muted">{t('printHelp')}</small>
        </div>

        <div className="print-only"><h1 style={{ fontFamily: 'var(--font-display)' }}>{stack.name}</h1></div>

        {view === 'list' ? (
          <div className="card flat sheet-cols gap-top">
            {order.map((c, i) => (
              <div key={c} className="sc-row">
                <b>{i + 1}</b>
                <CardChip card={c} size="md" />
                {withImages && state.images[c] && <><ImageThumb img={state.images[c]} /><small style={{ fontSize: '.72rem' }}>{state.images[c]!.text}</small></>}
              </div>
            ))}
          </div>
        ) : (
          <div className="card flat gap-top" style={{ overflowX: 'auto' }}>
            <table className="table" style={{ textAlign: 'center' }}>
              <thead>
                <tr><th />{SUITS.map((s) => <th key={s} style={{ textAlign: 'center' }}><SuitIcon suit={s} size={22} color={s === 'H' || s === 'D' ? 'var(--suit-red-ui)' : 'var(--suit-black-ui)'} /></th>)}</tr>
              </thead>
              <tbody>
                {RANKS.map((r) => (
                  <tr key={r}>
                    <th style={{ fontSize: '1rem', color: 'var(--text)' }}>{rankLabel(r, danish ? 'da' : 'en')}</th>
                    {SUITS.map((s) => (
                      <td key={s} style={{ textAlign: 'center', fontWeight: 800, fontSize: '1.1rem', color: s === 'H' || s === 'D' ? 'var(--suit-red-ui)' : undefined }}>
                        {posOf.get(`${r}${s}` as CardId) ?? '–'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Page>
    </>
  );
}
