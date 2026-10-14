/** Eksport/import af enkelte stacks (JSON eller ren tekst). */
import { formatOrder, isCardId, parseCardList } from '../../data/cards';
import type { Stack } from '../../data/stacks';
import { downloadFile, safeFileName } from '../../lib/files';

export interface StackFile {
  type: 'stackmaster-stack';
  version: 1;
  name: string;
  author?: string;
  description?: string;
  order: string[];
}

export function exportStack(s: Stack) {
  const data: StackFile = {
    type: 'stackmaster-stack', version: 1, name: s.name, author: s.author, description: s.description,
    order: s.order.map((c) => c ?? ''),
  };
  downloadFile(`${safeFileName(s.name)}.stack.json`, JSON.stringify(data, null, 2));
}

export function stackAsText(s: Stack) {
  return `${s.name}\n${formatOrder(s.order)}`;
}

/** Læser en stack fra JSON (vores format) eller fra ren tekst med kort. */
export function parseStackFile(text: string, fallbackName: string): Pick<Stack, 'name' | 'author' | 'description' | 'order'> | null {
  try {
    const j = JSON.parse(text) as Partial<StackFile>;
    if (j && Array.isArray(j.order)) {
      return {
        name: j.name || fallbackName,
        author: j.author,
        description: j.description,
        order: Array.from({ length: 52 }, (_, i) => {
          const c = String(j.order![i] ?? '').toUpperCase();
          return isCardId(c) ? c : null;
        }),
      };
    }
  } catch { /* ikke JSON – prøv tekst */ }
  const { cards } = parseCardList(text);
  if (!cards.length) return null;
  return { name: fallbackName, order: Array.from({ length: 52 }, (_, i) => cards[i] ?? null) };
}
