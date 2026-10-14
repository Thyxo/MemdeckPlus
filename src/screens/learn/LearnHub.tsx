/** Lær-fanen: guidet indlæring i bidder, billeder/historier, memory palace og mønstre. */
import { StackSelect, useActive } from '../../components/StackSelect';
import { Bar, EmptyState, NavRow, Page, TopBar } from '../../components/ui';
import { ALL_CARDS } from '../../data/cards';
import { useT } from '../../i18n';
import { navigate } from '../../lib/router';

export function LearnHub() {
  const t = useT();
  const { state, stack, complete } = useActive();
  const lp = state.learn[stack.id];
  const chunkSize = lp?.chunkSize ?? 8;
  const chunks = Math.ceil(52 / chunkSize);
  const passed = lp?.passed.length ?? 0;
  const imgs = ALL_CARDS.filter((c) => state.images[c]).length;
  const palaces = state.palaces.filter((p) => p.stackId === stack.id).length;
  const methodHint = state.settings.method === 'palace' ? t('methodPalaceHint') : state.settings.method === 'images' ? t('methodImagesHint') : t('methodRoteHint');

  return (
    <>
      <TopBar title={t('tabLearn')} />
      <Page>
        <StackSelect />
        {!complete ? (
          <EmptyState icon="library" title={t('stackIncompleteTitle')} text={t('stackIncompleteText')}
            action={<button className="btn primary" onClick={() => navigate(`/library/${stack.id}`)}>{t('completeStack')}</button>} />
        ) : (
          <>
            <div className="card hero gap-top stack-v">
              <small>{t('buildTheStack')}</small>
              <h2 className="display" style={{ fontSize: '1.4rem' }}>{t('chunksPassed', { n: passed, m: chunks })}</h2>
              <Bar value={(passed / chunks) * 100} />
              <small>{methodHint}</small>
              <button className="btn primary" onClick={() => navigate('/learn/build')}>{passed ? t('continue') : t('startLearning')}</button>
            </div>
            <div className="section-title">{t('memoryAids')}</div>
            <div className="navlist">
              <NavRow icon="image" title={t('imagesAndStories')} desc={t('imagesDesc')} badge={`${imgs}/52`} onClick={() => navigate('/learn/images')} />
              <NavRow icon="map" title={t('memoryPalace')} desc={t('palaceDesc')} badge={palaces ? String(palaces) : undefined} onClick={() => navigate('/learn/palace')} />
              <NavRow icon="pattern" title={t('patterns')} desc={t('patternsDesc')} onClick={() => navigate('/learn/patterns')} />
            </div>
          </>
        )}
      </Page>
    </>
  );
}
