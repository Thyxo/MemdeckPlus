/** Simpel i18n: dansk (standard) og engelsk. Nøgler er typetjekkede mod den danske ordbog. */
import { useMemo } from 'react';
import { getState, useApp } from '../store/store';
import type { Lang } from '../store/types';
import { da } from './da';
import { en } from './en';

export type TKey = keyof typeof da;
export type TFn = (key: TKey, vars?: Record<string, string | number>) => string;

const DICTS: Record<Lang, Record<TKey, string>> = { da, en };

export function makeT(lang: Lang): TFn {
  const dict = DICTS[lang] ?? da;
  return (key, vars) => {
    let s = dict[key] ?? da[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
    return s;
  };
}

export function useT(): TFn {
  const lang = useApp().settings.lang;
  return useMemo(() => makeT(lang), [lang]);
}

/** Til brug uden for React-komponenter. */
export function t(key: TKey, vars?: Record<string, string | number>) {
  return makeT(getState().settings.lang)(key, vars);
}

/** Dynamiske nøgler (fx `badge.${id}`) – falder tilbage til selve nøglen. */
export function tk(tf: TFn, key: string, vars?: Record<string, string | number>) {
  return tf(key as TKey, vars);
}
