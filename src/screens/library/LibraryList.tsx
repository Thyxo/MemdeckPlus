/** Stack-bibliotek: oversigt, aktiv stack, handlinger (omdøb, duplikér, eksportér, slet) og import. */
import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { PlayingCard } from '../../components/PlayingCard';
import { EmptyState, Page, Sheet, TopBar, confirmDialog, promptDialog } from '../../components/ui';
import { validateOrder } from '../../data/cards';
import type { Stack } from '../../data/stacks';
import { useT } from '../../i18n';
import { copyText, pickFile } from '../../lib/files';
import { navigate } from '../../lib/router';
import { actions, emit, masteryOf, useApp } from '../../store/store';
import { exportStack, parseStackFile, stackAsText } from './stackIO';

export function LibraryList() {
  const t = useT();
  const state = useApp();
  const [menu, setMenu] = useState<Stack | null>(null);

  const importFile = async () => {
    const f = await pickFile('.json,.txt,application/json,text/plain');
    if (!f) return;
    const parsed = parseStackFile(await f.text(), f.name.replace(/\.(stack\.)?(json|txt)$/i, ''));
    if (!parsed) return emit('toast', 'importFailed');
    const id = actions.createStack(parsed);
    emit('toast', 'stackImported');
    navigate(`/library/${id}`);
  };

  return (
    <>
      <TopBar
        title={t('tabLibrary')}
        right={
          <>
            <button className="icon-btn" onClick={importFile} aria-label={t('importStack')}><Icon name="upload" /></button>
            <button className="icon-btn filled" onClick={() => navigate('/library/new')} aria-label={t('newStack')}><Icon name="plus" /></button>
          </>
        }
      />
      <Page>
        <p className="muted">{t('libraryIntro')}</p>
        <div className="navlist gap-top">
          {state.stacks.map((s) => {
            const v = validateOrder(s.order);
            const active = s.id === state.activeStackId;
            const m = masteryOf(state, s);
            return (
              <div key={s.id} className={`card ${active ? 'gold-edge' : ''}`} style={{ padding: 14 }}>
                <div className="spread" style={{ alignItems: 'flex-start' }}>
                  <button className="navrow-text" style={{ background: 'none', border: 0, textAlign: 'left', padding: 0, color: 'inherit' }}
                    onClick={() => navigate(`/library/${s.id}`)}>
                    <b className="display" style={{ fontSize: '1.15rem' }}>{s.name}</b>
                    <small>{s.author || (s.builtIn ? '' : t('customStack'))}</small>
                  </button>
                  <button className="icon-btn" onClick={() => setMenu(s)} aria-label={t('moreActions')}>
                    <span style={{ fontSize: 22, lineHeight: 1 }}>⋯</span>
                  </button>
                </div>
                <button onClick={() => navigate(`/library/${s.id}`)} style={{ display: 'flex', gap: 0, background: 'none', border: 0, padding: '8px 0', width: '100%' }} aria-label={t('openStack')}>
                  {s.order.slice(0, 7).map((c, i) => (
                    <span key={i} style={{ marginLeft: i ? -18 : 0, transform: `rotate(${(i - 3) * 3}deg)` }}>
                      <PlayingCard card={c} faceDown={!c} width={52} />
                    </span>
                  ))}
                </button>
                <div className="stack-h" style={{ justifyContent: 'space-between' }}>
                  <div className="stack-h">
                    {v.ok ? <span className="pill ok">✓ 52/52</span> : <span className="pill bad">{t('filledOf', { n: v.filled })}</span>}
                    {s.builtIn && <span className="pill">{t('builtIn')}</span>}
                    {v.ok && <span className="pill gold">{t('masteryPct', { n: m })}</span>}
                  </div>
                  {active ? (
                    <span className="pill gold">★ {t('active')}</span>
                  ) : (
                    <button className="btn sm outline" disabled={!v.ok} onClick={() => { actions.setActiveStack(s.id); emit('toast', 'stackActivated'); }}>
                      {t('useStack')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {state.stacks.length === 1 && (
          <EmptyState icon="library" title={t('noCustomStacks')} text={t('noCustomStacksText')}
            action={<button className="btn primary" onClick={() => navigate('/library/new')}><Icon name="plus" /> {t('newStack')}</button>} />
        )}
      </Page>

      <Sheet open={!!menu} onClose={() => setMenu(null)} title={menu?.name}>
        {menu && (
          <div className="navlist">
            <button className="navrow" onClick={() => { navigate(`/library/${menu.id}`); setMenu(null); }}><span className="navrow-icon"><Icon name="edit" /></span><span className="navrow-text"><b>{menu.builtIn ? t('view') : t('edit')}</b></span></button>
            {!menu.builtIn && (
              <button className="navrow" onClick={async () => {
                const n = await promptDialog({ title: t('rename'), value: menu.name });
                if (n) actions.renameStack(menu.id, n);
                setMenu(null);
              }}><span className="navrow-icon"><Icon name="name" /></span><span className="navrow-text"><b>{t('rename')}</b></span></button>
            )}
            <button className="navrow" onClick={async () => {
              const n = await promptDialog({ title: t('duplicateAs'), value: `${menu.name} (${t('copy')})` });
              if (n) { const id = actions.duplicateStack(menu.id, n); emit('toast', 'stackDuplicated'); navigate(`/library/${id}`); }
              setMenu(null);
            }}><span className="navrow-icon"><Icon name="copy" /></span><span className="navrow-text"><b>{t('duplicate')}</b></span></button>
            <button className="navrow" onClick={() => { exportStack(menu); setMenu(null); }}><span className="navrow-icon"><Icon name="download" /></span><span className="navrow-text"><b>{t('exportJson')}</b></span></button>
            <button className="navrow" onClick={async () => {
              const ok = await copyText(stackAsText(menu));
              emit('toast', ok ? 'copied' : 'copyFailed');
              setMenu(null);
            }}><span className="navrow-icon"><Icon name="copy" /></span><span className="navrow-text"><b>{t('copyAsText')}</b></span></button>
            {!menu.builtIn && (
              <button className="navrow" onClick={async () => {
                const ok = await confirmDialog({ title: t('deleteStackQ', { name: menu.name }), body: t('deleteStackBody'), ok: t('delete'), danger: true });
                if (ok) { actions.deleteStack(menu.id); emit('toast', 'stackDeleted'); }
                setMenu(null);
              }}><span className="navrow-icon" style={{ color: 'var(--bad)' }}><Icon name="trash" /></span><span className="navrow-text"><b className="bad">{t('delete')}</b></span></button>
            )}
          </div>
        )}
      </Sheet>
    </>
  );
}
