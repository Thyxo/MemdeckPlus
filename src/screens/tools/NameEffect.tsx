/**
 * Navnebaseret effekt-hjælp: skriv et navn og se kortet ved hvert bogstavs position.
 * Skema-regler: alfabet-nummer, løbende sum (mod 52) eller stavning (ét kort pr. bogstav).
 */
import { useState } from 'react';
import { useActive } from '../../components/StackSelect';
import { CardChip } from '../../components/PlayingCard';
import { Page, Segmented, Stepper, TopBar } from '../../components/ui';
import { useT } from '../../i18n';

type Rule = 'alpha' | 'sum' | 'spell';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÆØÅ';
const wrap = (n: number) => ((((n - 1) % 52) + 52) % 52) + 1;

export function NameEffect() {
  const t = useT();
  const { cardAt } = useActive();
  const [name, setName] = useState('Freja');
  const [rule, setRule] = useState<Rule>('alpha');
  const [offset, setOffset] = useState(0);
  const letters = name.toUpperCase().split('').filter((ch) => ALPHABET.includes(ch));

  let sum = 0;
  const rows = letters.map((ch, i) => {
    const v = ALPHABET.indexOf(ch) + 1;
    sum += v;
    const pos = wrap((rule === 'alpha' ? v : rule === 'sum' ? sum : i + 1) + offset);
    return { ch, v, pos, card: cardAt(pos)! };
  });
  const finalPos = wrap(letters.length + 1 + offset);

  return (
    <>
      <TopBar title={t('nameEffect')} backTo="/tools" />
      <Page>
        <input className="input" style={{ fontSize: '1.3rem', fontWeight: 700 }} value={name} onChange={(e) => setName(e.target.value)} placeholder={t('typeName')} aria-label={t('typeName')} />
        <div className="gap-top"><Segmented value={rule} onChange={setRule} options={[{ value: 'alpha', label: t('ruleAlpha') }, { value: 'sum', label: t('ruleSum') }, { value: 'spell', label: t('ruleSpell') }]} /></div>
        <p className="muted" style={{ fontSize: '.85rem' }}>{t(rule === 'alpha' ? 'ruleAlphaDesc' : rule === 'sum' ? 'ruleSumDesc' : 'ruleSpellDesc')}</p>
        <div className="spread"><span>{t('offsetLabel')}</span><Stepper value={offset} min={0} max={51} onChange={setOffset} /></div>

        {rows.length === 0 ? <p className="muted center gap-top">{t('typeName')}</p> : (
          <div className="card flat gap-top">
            <table className="table">
              <thead><tr><th>{t('letter')}</th><th>{rule === 'spell' ? '#' : t('value')}</th><th>{t('position')}</th><th>{t('card')}</th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}><td><b style={{ fontSize: '1.2rem' }}>{r.ch}</b></td><td className="muted">{rule === 'sum' ? `${r.v} (Σ)` : rule === 'spell' ? i + 1 : r.v}</td><td><b className="gold">{r.pos}</b></td><td><CardChip card={r.card} size="md" /></td></tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rule === 'spell' && rows.length > 0 && (
          <div className="feedback good gap-top"><span>🪄</span><span>{t('spellResult', { n: letters.length })} <CardChip card={cardAt(finalPos)!} size="md" /> (#{finalPos})</span></div>
        )}
        {rule === 'alpha' && rows.length > 0 && (
          <div className="chip-row gap-top" style={{ justifyContent: 'center' }}>{rows.map((r, i) => <CardChip key={i} card={r.card} size="lg" />)}</div>
        )}
      </Page>
    </>
  );
}
