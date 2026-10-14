/** Opsætning & brug: sæt spillet op, tjek spillet og værktøjer til optræden. */
import { StackSelect, useActive } from '../../components/StackSelect';
import { EmptyState, NavRow, Page, TopBar } from '../../components/ui';
import { useT } from '../../i18n';
import { navigate } from '../../lib/router';

export function ToolsHub() {
  const t = useT();
  const { stack, complete } = useActive();
  return (
    <>
      <TopBar title={t('tabToolsLong')} right={<button className="icon-btn" onClick={() => navigate('/stats')} aria-label={t('stats')}>📊</button>} />
      <Page>
        <StackSelect />
        {!complete ? (
          <EmptyState icon="library" title={t('stackIncompleteTitle')} text={t('stackIncompleteText')}
            action={<button className="btn primary" onClick={() => navigate(`/library/${stack.id}`)}>{t('completeStack')}</button>} />
        ) : (
          <>
            <div className="section-title">{t('deckSetup')}</div>
            <div className="navlist">
              <NavRow icon="deck" title={t('setupDeck')} desc={t('setupDeckDesc')} onClick={() => navigate('/tools/setup')} />
              <NavRow icon="checklist" title={t('checkDeck')} desc={t('checkDeckDesc')} onClick={() => navigate('/tools/check')} />
            </div>
            <div className="section-title">{t('performance')}</div>
            <div className="navlist">
              <NavRow icon="eye" title={t('lookup')} desc={t('lookupDesc')} onClick={() => navigate('/tools/lookup')} />
              <NavRow icon="scissors" title={t('cutCalc')} desc={t('cutCalcDesc')} onClick={() => navigate('/tools/cut')} />
              <NavRow icon="name" title={t('nameEffect')} desc={t('nameEffectDesc')} onClick={() => navigate('/tools/name')} />
              <NavRow icon="scale" title={t('countCards')} desc={t('countCardsDesc')} onClick={() => navigate('/tools/count')} />
              <NavRow icon="hash" title={t('acaan')} desc={t('acaanDesc')} onClick={() => navigate('/tools/acaan')} />
            </div>
            <div className="section-title">{t('cheatSheets')}</div>
            <div className="navlist">
              <NavRow icon="print" title={t('cheatSheets')} desc={t('cheatSheetsDesc')} onClick={() => navigate('/tools/sheets')} />
            </div>
          </>
        )}
      </Page>
    </>
  );
}
