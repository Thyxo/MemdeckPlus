/** Memory palaces: liste og oprettelse fra skabelon (København-rute, lejlighed) eller tom. */
import { useState } from 'react';
import { Icon } from '../../components/Icon';
import { useActive } from '../../components/StackSelect';
import { EmptyState, Page, Segmented, Sheet, TopBar } from '../../components/ui';
import { uid } from '../../data/stacks';
import { useT } from '../../i18n';
import { navigate } from '../../lib/router';
import { actions } from '../../store/store';
import type { PalaceStop } from '../../store/types';

type Tpl = { id: string; name: { da: string; en: string }; stops: [string, string][] };

export const PALACE_TEMPLATES: Tpl[] = [
  {
    id: 'cph',
    name: { da: 'Nørreport → Strøget → Tivoli', en: 'Nørreport → Strøget → Tivoli' },
    stops: [
      ['🚉', 'Nørreport Station'], ['🥬', 'Torvehallerne'], ['⛲', 'Kultorvet'], ['🗼', 'Rundetårn'],
      ['🛍️', 'Købmagergade'], ['⛪', 'Vor Frue Kirke'], ['🍺', 'Gråbrødretorv'], ['🕊️', 'Amagertorv · Storkespringvandet'],
      ['🔔', 'Helligåndskirken'], ['⛲', 'Gammeltorv'], ['⚖️', 'Nytorv · Domhuset'], ['🕰️', 'Rådhuspladsen'], ['🎡', 'Tivolis indgang'],
    ],
  },
  {
    id: 'home',
    name: { da: 'Min lejlighed', en: 'My apartment' },
    stops: [
      ['🚪', 'Hoveddøren|Front door'], ['🧥', 'Knagerækken i entréen|Coat rack'], ['👟', 'Skoreolen|Shoe rack'], ['🛁', 'Badeværelset|Bathroom'],
      ['🧊', 'Køleskabet|Fridge'], ['🍳', 'Komfuret|Stove'], ['🍽️', 'Spisebordet|Dining table'], ['🛋️', 'Sofaen|Sofa'],
      ['📺', 'Fjernsynet|TV'], ['🪴', 'Altanen|Balcony'], ['🛏️', 'Soveværelset|Bedroom'], ['🎮', 'Den ældste drengs værelse|Eldest son’s room'],
      ['⚽', 'Den yngste drengs værelse|Youngest son’s room'],
    ],
  },
];

export function Palaces() {
  const t = useT();
  const { state, stack } = useActive();
  const [open, setOpen] = useState(false);
  const [tpl, setTpl] = useState('cph');
  const [per, setPer] = useState(4);
  const lang = state.settings.lang;
  const list = state.palaces.filter((p) => p.stackId === stack.id);

  const create = () => {
    const tp = PALACE_TEMPLATES.find((x) => x.id === tpl);
    const stops: PalaceStop[] = tp
      ? tp.stops.map(([emoji, name]) => ({ id: uid('stop'), emoji, name: name.includes('|') ? name.split('|')[lang === 'da' ? 0 : 1] : name }))
      : [{ id: uid('stop'), emoji: '📍', name: t('stopN', { n: 1 }) }];
    const id = uid('palace');
    actions.savePalace({ id, name: tp ? tp.name[lang] : t('myRoute'), stackId: stack.id, perStop: per, startPos: 1, stops, createdAt: Date.now() });
    setOpen(false);
    navigate(`/learn/palace/${id}`);
  };

  return (
    <>
      <TopBar title={t('memoryPalace')} backTo="/learn" right={<button className="icon-btn filled" onClick={() => setOpen(true)} aria-label={t('newRoute')}><Icon name="plus" /></button>} />
      <Page>
        <p className="muted">{t('palaceIntro')}</p>
        {list.length === 0 ? (
          <EmptyState icon="map" title={t('noPalaces')} text={t('noPalacesText')} action={<button className="btn primary" onClick={() => setOpen(true)}><Icon name="plus" /> {t('newRoute')}</button>} />
        ) : (
          <div className="navlist gap-top">
            {list.map((p) => {
              const covered = Math.min(52, p.stops.length * p.perStop);
              return (
                <button key={p.id} className="navrow" onClick={() => navigate(`/learn/palace/${p.id}`)}>
                  <span className="navrow-icon">🏛️</span>
                  <span className="navrow-text">
                    <b>{p.name}</b>
                    <small>{t('palaceSummary', { stops: p.stops.length, per: p.perStop, n: covered })}</small>
                    <span style={{ marginTop: 4 }}>{p.stops.slice(0, 10).map((s) => s.emoji).join(' ')}</span>
                  </span>
                  <Icon name="chevron" className="muted" />
                </button>
              );
            })}
          </div>
        )}
      </Page>
      <Sheet open={open} onClose={() => setOpen(false)} title={t('newRoute')} footer={<button className="btn primary" onClick={create}>{t('create')}</button>}>
        <div className="stack-v">
          {[...PALACE_TEMPLATES.map((x) => ({ id: x.id, label: x.name[lang], icon: x.id === 'cph' ? '🏙️' : '🏠', n: x.stops.length })), { id: 'blank', label: t('blankRoute'), icon: '✏️', n: 0 }].map((x) => (
            <button key={x.id} className={`choice ${tpl === x.id ? 'on' : ''}`} onClick={() => setTpl(x.id)}>
              <span className="c-icon">{x.icon}</span>
              <span className="navrow-text"><b>{x.label}</b>{x.n > 0 && <small>{t('nStops', { n: x.n })}</small>}</span>
            </button>
          ))}
          <div className="field">{t('cardsPerStop')}
            <Segmented value={per} onChange={setPer} options={[{ value: 3, label: '3' }, { value: 4, label: '4' }]} />
          </div>
          <small className="muted">{t('stopsNeeded', { n: Math.ceil(52 / per) })}</small>
        </div>
      </Sheet>
    </>
  );
}
