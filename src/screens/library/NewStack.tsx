/** Opret ny stack: fra skabelon (Aronson, Redford, Si Stebbins, Eight Kings, tom) eller fra tekst. */
import { useState } from 'react';
import { Page, TopBar } from '../../components/ui';
import { parseCardList } from '../../data/cards';
import { TEMPLATES, emptyOrder } from '../../data/stacks';
import { tk, useT } from '../../i18n';
import { navigate } from '../../lib/router';
import { actions } from '../../store/store';

export function NewStack() {
  const t = useT();
  const [tpl, setTpl] = useState('blank');
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const template = TEMPLATES.find((x) => x.id === tpl)!;
  const parsed = text.trim() ? parseCardList(text) : null;

  const create = () => {
    let order = template.generate ? template.generate() : emptyOrder();
    if (parsed?.cards.length) order = Array.from({ length: 52 }, (_, i) => parsed.cards[i] ?? null);
    const id = actions.createStack({
      name: name.trim() || template.name || t('myStack'),
      author: template.author || undefined,
      templateId: template.id,
      order,
    });
    navigate(`/library/${id}`, true);
  };

  return (
    <>
      <TopBar title={t('newStack')} backTo="/library" />
      <Page>
        <div className="section-title">{t('chooseTemplate')}</div>
        <div className="stack-v">
          {TEMPLATES.map((x) => (
            <button key={x.id} className={`choice ${tpl === x.id ? 'on' : ''}`} onClick={() => { setTpl(x.id); if (!name || TEMPLATES.some((y) => y.name === name)) setName(x.name); }}>
              <span className="c-icon">{x.generate ? '⚙️' : x.id === 'blank' ? '✏️' : '📋'}</span>
              <span className="navrow-text">
                <b>{x.name || t('blankStack')}</b>
                <small>{tk(t, x.descKey)}</small>
              </span>
            </button>
          ))}
        </div>

        <div className="section-title">{t('nameLabel')}</div>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t('myStack')} maxLength={60} />

        {!template.generate && (
          <>
            <div className="section-title">{t('pasteOrder')}</div>
            <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="4C 2H 7D 3C 4H 6D AS …" />
            {parsed && (
              <p className={parsed.cards.length === 52 ? 'ok' : 'muted'}>
                {t('parsedCards', { n: parsed.cards.length })}
                {parsed.invalid.length > 0 && <span className="bad"> · {t('invalidTokens')}: {parsed.invalid.slice(0, 6).join(', ')}</span>}
              </p>
            )}
            <p className="muted" style={{ fontSize: '.85rem' }}>{t('pasteHelp')}</p>
          </>
        )}

        <button className="btn primary block big gap-top" onClick={create}>{t('createStack')}</button>
      </Page>
    </>
  );
}
