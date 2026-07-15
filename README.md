# Lissabon — Familievakantie planner

Een kleine mobiel-first webapp voor de familievakantie naar Lissabon (23 – 30 juli 2026).
Geïmplementeerd vanuit het Claude Design-prototype (`Lissabon App.dc.html`) in **React + TypeScript + Vite**.

## Functies

- **Inloggen** — wachtwoord is `vakantie`. De naam is vrij in te vullen (standaard "Familie Voskamp").
  De sessie blijft bewaard in `localStorage`; via **Docs → Uitloggen** log je weer uit.
- **Overzicht** — reisgegevens, vluchten (Transavia HV5243/HV5244), verblijf (met link naar het
  hotel), vaste dagtrips, aftel-teller én **live weer** voor Lissabon (7-daagse verwachting, met bronlink).
- **Wensen** — Tinder-achtig kaartendeck: per uitje een plaatje, uitleg, afstand én tijdsduur.
  Iedereen logt onder eigen naam in en geeft 1–5 sterren; de ranglijst toont de sterren van
  het hele gezin plus het gemiddelde, en van daaruit plan je uitjes in.
- **Planning** — 8 dagen (bewust grotendeels leeg; alleen vluchten, hotel en dagtrips staan vast)
  met slepen/omhoog-omlaag, afvinken, verwijderen en eigen activiteiten toevoegen.
- **Quiz** — dagelijkse Lissabon-quiz met vijf vragen, eigen tabblad.
- **Tips** — praktische tips per thema (favorieten met ★).
- **Docs** — vlucht- en passagiersgegevens en contact.

## Weer

Het weer komt van [Open-Meteo](https://open-meteo.com/) — gratis en zonder API-sleutel.
Locatie: Lissabon (38.7223, -9.1393), tijdzone Europe/Lisbon.

## Gedeelde sterren (Supabase)

De Wensen-sterren kunnen tussen alle telefoons worden gedeeld via Supabase. Zonder
configuratie werkt de app gewoon door, maar bewaart hij de sterren alleen lokaal
(per apparaat).

Instellen:

1. Maak een Supabase-project aan (gratis tier volstaat).
2. Draai `supabase/migrations/0001_wensen_ratings.sql` in **SQL Editor → New query → Run**.
   Dit maakt de tabel `wensen_ratings`, zet Row Level Security aan met open lees-/
   schrijfrechten voor de publieke key (familie-app zonder echte accounts) en zet
   realtime aan.
3. Zet in `.env.local` de waarden `VITE_SUPABASE_URL` en `VITE_SUPABASE_ANON_KEY`
   (Project Settings → API — gebruik de **anon/publishable** key, nooit de service_role).
4. Herstart `npm run dev`.

De app laadt bij het opstarten alle sterren, luistert live mee (realtime) en schrijft
optimistisch weg; `localStorage` blijft de offline-cache.

## Ontwikkelen

```bash
npm install
npm run dev        # start dev server
npm run build      # typecheck + productie-build naar dist/
npm run preview    # preview van de build
```

## Techniek

- React 18 + TypeScript, Vite 5
- Geen backend — alle status in `localStorage`
- Lettertypen: Bricolage Grotesque (koppen) + Instrument Sans (tekst) via Google Fonts
- Ontwerp: warme "azulejo"-stijl uit het originele prototype, pixel-getrouw overgenomen
