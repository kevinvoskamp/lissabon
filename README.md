# Lissabon — Familievakantie planner

Mobiel-first webapp voor de familievakantie naar Lissabon (**23 – 30 juli 2026**, 2 volwassenen
+ 2 kinderen). Gebouwd vanuit het Claude Design-prototype (`Lissabon App.dc.html`) in
**React + TypeScript + Vite**, met **Supabase** voor alles wat het gezin deelt.

| | |
|---|---|
| **Live** | https://lissabon-vakantie.vercel.app |
| **Repo** | github.com/kevinvoskamp/lissabon (privé) |
| **Lokaal** | `C:\Users\kevin\OneDrive\VosIQ\lissabon` |
| **Hosting** | Vercel, project `lissabon` (team `vosiq`) — deployt automatisch bij elke push naar `main` |
| **Database** | Supabase project **`ninfwxdnsptwiowlisqp`** ("kevinvoskamp@hotmail.com's Project") |

---

## Snel starten

```bash
npm install
npm run dev        # dev server (poort naar keuze: npm run dev -- --port 5219)
npm run build      # tsc --noEmit + productie-build naar dist/
npm run typecheck
```

`.env.local` staat **niet** in git. Inhoud:

```
VITE_SUPABASE_URL=https://ninfwxdnsptwiowlisqp.supabase.co
VITE_SUPABASE_ANON_KEY=<anon / publishable key>
```

Zonder deze waarden werkt de app gewoon door, maar bewaart alles alleen lokaal per apparaat
(je ziet dat aan het bolletje onderin de Wensen-tab).

---

## Wat de app doet

Zeven tabs onderin (`src/Planner.tsx` → `navItems`):

| Tab | Bestand | Wat het doet |
|---|---|---|
| 🏠 **Start** | `Planner.tsx` (`Overview`) | Reisgegevens, vluchten, hotel (link), dagtrips, aftelteller en **live weer** (7-daagse verwachting) |
| ⭐ **Wensen** | `Wensen.tsx` | Tinder-achtig kaartendeck: 1–5 sterren per uitje. Ranglijst op **totaal** van alle sterren, met per persoon wie wat gaf. Eigen ideeën toevoegen. Knop **"In te plannen"** zet iets op de shortlist |
| 🗺️ **Kaart** | `Kaart.tsx` | Echte OpenStreetMap-kaart (Leaflet) met genummerde spelden, hotel als ster. Schakelaar Stad/Met dagtrips. Lijst per gebied met **gemiddelde sterren**, laat zien wat te combineren is |
| 📅 **Planning** | `Planner.tsx` (`Planning`) | Alle 8 dagen onder elkaar. Bovenaan "Nog in te plannen" (shortlist) → daar kies je per idee de dag. Slepen/▲▼, afvinken, verwijderen, zelf toevoegen |
| 🧠 **Quiz** | `Quiz.tsx` | Startknop + timer, 5 vragen, dagranglijst (hoogste score, dan snelste tijd). **Eén poging per persoon per dag** |
| 🎒 **Tips** | `Planner.tsx` (`Tips`) | Praktische tips per thema, favorieten met ★ (lokaal) |
| 🎫 **Info** | `Planner.tsx` (`Docs`) | Vlucht- en passagiersgegevens + zelf gegevens toevoegen (taxi, reserveringen). Uitloggen |

### Inloggen
Wachtwoord is altijd **`vakantie`**. Naam kiezen via chips (Kevin / Danielle / Maura / Lieke) of
vrij intikken. De naam bepaalt onder wie sterren, quiz-scores en toevoegingen worden opgeslagen.
Geen echte accounts — de app is beveiligd met dat ene gedeelde wachtwoord.

---

## Data & synchronisatie

Alles wat het gezin deelt staat in Supabase, met prefix **`lsb_`** (lsb = Lissabon, om het te
scheiden van de andere apps in datzelfde project).

| Tabel | Inhoud | Hook |
|---|---|---|
| `lsb_wensen_ratings` | sterren per persoon per activiteit | `src/ratings.ts` → `useRatings()` |
| `lsb_planning_items` | planning én shortlist (`day_idx` 0–7 = reisdag, **-1 = nog in te plannen**) | `src/planning.ts` → `usePlanning()` |
| `lsb_wensen_items` | zelf toegevoegde wensen | `src/sharedList.ts` → `useSharedList()` |
| `lsb_info_items` | zelf toegevoegde gegevens (Info-tab) | `src/sharedList.ts` |
| `lsb_quiz_results` | quiz-uitslag per persoon per dag | `src/Quiz.tsx` |

**Patroon van alle hooks:** bij het opstarten alles ophalen → realtime meeluisteren
(`postgres_changes`) → optimistisch wegschrijven → `localStorage` als offline-cache en
fallback. Zonder Supabase-config werkt de app gewoon door, alleen niet gedeeld.

**RLS:** aan, met open lees/schrijf-policies voor de anon-key. Bewuste keuze: er zijn geen
echte accounts en er staat niets gevoeligs in (namen + sterren). De andere apps in dit project
(welslapen staat overigens in een **apart** project) houden hun eigen strengere RLS.

Migraties staan in `supabase/migrations/`, maar zijn **handmatig** gedraaid via de SQL Editor.
Er draait geen migratietool.

---

## Belangrijke valkuilen (uit ervaring)

- **Twee Supabase-projecten.** Er bestaat ook `ppnbkndpuaxogzoaxxzr` (een los lissabon-project uit
  een eerdere poging). Dat wordt **niet** meer gebruikt. Als tabellen "niet bestaan" volgens de
  app maar wél in de SQL Editor: check of je in project `ninfwxdnsptwiowlisqp` zit — de
  projectcode staat in de dashboard-URL.
- **Vite bakt env-vars in tijdens de build.** Na het wijzigen van env-vars in Vercel moet je
  opnieuw deployen, anders draait de oude waarde nog.
- **PostgREST schema-cache.** Nieuwe tabellen zijn soms even niet zichtbaar via de API.
  `notify pgrst, 'reload schema';` in de SQL Editor forceert een herlaadactie.
- **Storage-keys.** Bij structuurwijzigingen wordt de `localStorage`-key opgehoogd
  (`lissabon-planner-v5`, `lissabon-planning-rows-v1`, …), zodat oude telefoons niet blijven
  hangen op verouderde data.
- **Leaflet.** De kaart heeft een expliciete `setView` nodig vóór `fitBounds`, en
  `animate: false` — anders blijft 'ie op de verkeerde zoom staan.
- **PowerShell commits.** Aanhalingstekens in een here-string (`@'…'@`) breken `git commit`.
  Houd commit-berichten vrij van `"` en `'`.

---

## Techniek

- React 18 + TypeScript, Vite 5
- `@supabase/supabase-js` voor data + realtime
- `leaflet` + OpenStreetMap-tiles voor de kaart (geen API-sleutel nodig)
- Weer via [Open-Meteo](https://open-meteo.com/) (38.7223, -9.1393, Europe/Lisbon) — geen sleutel
- Lettertypen: Bricolage Grotesque (koppen) + Instrument Sans (tekst) via Google Fonts
- Ontwerp: warme azulejo-stijl uit het prototype, met de Portugese vlag in de header

### Bestanden

```
src/
  App.tsx          auth-gate: Login of Planner
  Login.tsx        wachtwoord "vakantie" + naam-chips
  Planner.tsx      tabs, Overview, Planning, Tips, Docs/Info + bottom nav
  Wensen.tsx       sterren-deck + ranglijst + eigen ideeën
  Kaart.tsx        Leaflet-kaart + gebiedenlijst met gemiddelde sterren
  Quiz.tsx         quiz met timer en dagranglijst
  data.ts          activiteiten, dag-meta, quizvragen, geo-coördinaten
  planning.ts      usePlanning() — gedeelde planning + shortlist
  ratings.ts       useRatings() — gedeelde sterren
  sharedList.ts    useSharedList() — generieke gedeelde lijst
  useWeather.ts    Open-Meteo
  lib/supabase.ts  client + isSupabaseConfigured
```

---

## Privacy

De repo is **privé**. Geboortedata en telefoonnummers zijn uit de app gehaald; namen,
stoelnummers en bagage-info staan er nog. De live site is bereikbaar voor iedereen met de
link, achter het gedeelde wachtwoord — dat is geen echte beveiliging, dus zet er niets
gevoeligs in.

## Ideeën die nog openstaan

- Paklijst met vinkjes per persoon
- Uitgaven bijhouden (wie betaalde wat)
- Foto's/PDF's uploaden bij Info (Supabase Storage, 1 GB gratis)
- PWA zodat de app als icoon op het startscherm staat
- Foto-dagboek per dag
