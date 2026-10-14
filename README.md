# StackMaster ♠

Mobil-first PWA til at **lære, huske og bruge memorerede kortspil** (stacks) i korttricks.
Installérbar på hjemmeskærmen, virker 100 % offline, al data lokalt på enheden. Dansk (standard) og engelsk.

**Teknik:** React 19 + TypeScript + Vite 8 + `vite-plugin-pwa` (Workbox). Ingen backend.
Data i `localStorage` (state) og IndexedDB (fotos).

---

## Kom i gang

```bash
npm install
npm run dev        # udviklingsserver på http://localhost:5173
npm run build      # typecheck + produktionsbuild i dist/ (inkl. service worker)
npm run preview    # server dist/ lokalt – test PWA/offline her
npm test           # enhedstests (kort-parser, stacks, SRS, mønstre)
npm run icons      # gen-generér PNG-ikoner fra public/icons/*.svg (kræver Playwright)
```

Kræver Node 20+.

## Deploy på Vercel

Projektet er klar til Vercel uden ekstra opsætning (`vercel.json` er med):

1. Push repoet til GitHub.
2. På [vercel.com/new](https://vercel.com/new): **Import Git Repository** → vælg repoet.
3. Framework: **Vite** (genkendes automatisk). Build: `npm run build`. Output: `dist`.
4. **Deploy.** Hvert push til `main` giver en ny produktions-deploy; andre branches giver preview-deploys.

Alternativt med CLI: `npx vercel` (preview) og `npx vercel --prod`.

`vercel.json` sørger for, at `sw.js` aldrig caches af CDN'et (så opdateringer slår igennem), og at
hashede assets caches i et år. Appen bruger hash-routing (`#/train`), så den virker uden server-rewrites.

## Installér som app

- **iPhone (Safari):** Del → *Føj til hjemmeskærm*.
- **Android (Chrome):** Menu → *Installér app*.
- **Desktop (Chrome/Edge):** Installér-ikonet i adresselinjen.

---

## Hvad er bygget

### Faner (bundnavigation)
| Fane | Indhold |
|---|---|
| **Hjem** | Aktiv stack, *Dagens træning* (én stor knap), streak, dagens mål, samlet beherskelse i %, genveje, seneste milepæl. Statistik og indstillinger øverst. |
| **Bibliotek** | Mnemonica forudfyldt (verificeret). Opret egne stacks fra skabeloner (Aronson, Redford – udfyldes af brugeren; Si Stebbins og Eight Kings – genereres), manuel indtastning med kortvælger, træk-og-slip, "flyt til position", tekstimport (`4C 2H 7D …`, `4♣ 2♥`, `T`, danske `B/D`), live-validering (manglende/dubletter/tomme), duplikér, omdøb, slet, eksport (JSON/tekst), import fra fil. |
| **Lær** | *Byg stakken* i bidder på 5–10 kort (vend kort, billede, historie → test, ≥ 90 % låser næste op). *Billeder & historier* (emoji/person/ting/tekst/foto, automatiske forslag til alle 52, **hent fotos online** fra Wikimedia Commons/Openverse – gemmes lokalt med kreditering, eller tag/vælg eget foto). *Memory palace*-bygger med ruteskabeloner (Nørreport → Strøget → Tivoli, Min lejlighed), 3–4 kort pr. stop, visuel rute. *Mønstre*: automatisk fundne (værdi = position, par, kulør-rækker, faste spring, spejl p/p+26, farve-rækker, hvor de fire ligger) + egne noter. |
| **Træn** | Leitner-SRS (5 bokse) pr. kort og retning, daglig kø. Øvelser: kort→position (talknapper), position→kort (kortvælger), næste/forrige, hurtig-runde 60 s med rekord, bidder (interval), hele rækkefølgen, svage kort. Grøn/rød feedback, korrekt svar + hukommelsestip (billede, historie, palace-stop), svartid. Indstillinger: tid pr. spørgsmål, retning, antal pr. session, nye kort pr. dag. |
| **Brug** (opsætning & brug) | *Sæt spillet op* (stak-orden eller fra sorteret spil, oplæsning via Web Speech, auto-stepper, halvvejs-tjek, skærmlås-wake-lock). *Tjek mit spil* (kort for kort eller tekst). *Hurtigt opslag* (sort skærm, stor skrift). *Cut-beregner* (flere cuts, bring kort til top/bund). *Navne-effekt* (alfabet, løbende sum, stavning, forskydning). *Antal kort (weighing)*. *ACAAN-tabel* (på/efter tallet, forskydning, print). *Cheat sheets* (1–52 og 52-grid, Print/PDF og PNG-eksport). |

### Statistik
Varmekort 4×13 farvet efter styrke (tryk for detaljer pr. retning/boks), svagheder, gns. svartid,
træfsikkerhed, streak-kalender (18 uger), graf over beherskelse og svar pr. dag (30 dage), 12 milepæle/badges med konfetti.

### Indstillinger
Sprog (da/en), tema (mørkt/lyst/system), haptik, lyd, danske billedkort (B/D/K), standard-retning, dagligt mål,
session-størrelse, nye kort pr. dag, tid pr. spørgsmål, metode, daglige påmindelser (Notification API),
eksport/import af fuld backup (inkl. fotos), nulstil fremskridt, slet alt. Onboarding på 3 skærme første gang.

### Kvalitet
- Egne SVG-kort og kulør-stier (ingen ophavsretsbeskyttet grafik; ♥/♦ vises aldrig som emoji).
- Store trykflader (≥ 44 px), tastaturstøtte, `aria`-labels, `prefers-reduced-motion`.
- Fejlhåndtering: offline-billedsøgning, CORS-fallback, fuldt lager, ugyldige filer.
- Enhedstests (Vitest) og E2E-gennemgang af alle flows i Chromium.

## Struktur

```
src/
  data/        kort-model, stacks (Mnemonica, skabeloner), billedforslag
  lib/         srs (Leitner), mønstre, billedsøgning, IndexedDB, backup, tale, haptik/lyd, router …
  store/       global state (persisteret), typer, badges
  i18n/        da.ts (kilde) + en.ts (typetjekket mod da)
  components/  PlayingCard (SVG), CardPicker, NumberPad, UI-byggeklodser
  screens/     home, library, learn, train, tools, stats, settings, onboarding
```

**Tilføj en indbygget stack:** udvid `builtinStacks()` eller `TEMPLATES` i `src/data/stacks.ts`.
**Tilføj en tekst:** nøgle i `src/i18n/da.ts` – TypeScript kræver den så også i `en.ts`.

## Begrænsninger
- Påmindelser vises kun, når appen/dens service worker kører (ingen push-server). På iPhone kræver notifikationer, at appen er føjet til hjemmeskærmen.
- "Scan" af rigtige kort med kamera er ikke med – *Tjek mit spil* bruger hurtig indtastning.
- Haptik understøttes ikke af Safari på iOS.

Mnemonica © Juan Tamariz. Rækkefølgen bruges som reference; køb bogen for metoden.
