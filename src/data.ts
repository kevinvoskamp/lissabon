export type CatKey = 'praktisch' | 'cultuur' | 'eten' | 'strand' | 'natuur' | 'uitzicht'

export const CATS: Record<CatKey, { label: string; color: string }> = {
  praktisch: { label: 'Praktisch', color: '#8a8f96' },
  cultuur: { label: 'Cultuur', color: '#b5674a' },
  eten: { label: 'Eten', color: '#c99a3f' },
  strand: { label: 'Strand & zee', color: '#3d7ea6' },
  natuur: { label: 'Natuur', color: '#5e8c61' },
  uitzicht: { label: 'Uitzicht', color: '#7a6aa0' },
}

export interface Item {
  id: string
  title: string
  cat: CatKey
  note: string
  done: boolean
}

export interface Day {
  wd: string
  dm: string
  title: string
  theme: string
  items: Item[]
}

let _id = 1
export const nid = () => 'a' + _id++

// De acht reisdagen (alleen de labels; de items komen uit de gedeelde planning).
export const DAY_META: Omit<Day, 'items'>[] = [
  { wd: 'Do', dm: '23/7', title: 'Donderdag 23 juli', theme: 'Aankomst in Lissabon' },
  { wd: 'Vr', dm: '24/7', title: 'Vrijdag 24 juli', theme: 'Nog in te vullen' },
  { wd: 'Za', dm: '25/7', title: 'Zaterdag 25 juli', theme: 'Nog in te vullen' },
  { wd: 'Zo', dm: '26/7', title: 'Zondag 26 juli', theme: 'Dagtrip Sintra' },
  { wd: 'Ma', dm: '27/7', title: 'Maandag 27 juli', theme: 'Nog in te vullen' },
  { wd: 'Di', dm: '28/7', title: 'Dinsdag 28 juli', theme: 'Dagtrip Cascais' },
  { wd: 'Wo', dm: '29/7', title: 'Woensdag 29 juli', theme: 'Nog in te vullen' },
  { wd: 'Do', dm: '30/7', title: 'Donderdag 30 juli', theme: 'Vertrek' },
]

// De vluchten staan vast en worden eenmalig geseed (vaste id's, dus geen dubbelen).
export const FLIGHT_SEED = [
  {
    id: 'flight-heen',
    day_idx: 0,
    pos: 0,
    title: 'Vlucht HV5243 Rotterdam → Lissabon',
    cat: 'praktisch' as CatKey,
    dur: '',
    note: 'Transavia · 16:00 – 17:55',
    done: false,
  },
  {
    id: 'flight-terug',
    day_idx: 7,
    pos: 0,
    title: 'Terugvlucht HV5244 Lissabon → Rotterdam',
    cat: 'praktisch' as CatKey,
    dur: '',
    note: 'Transavia · 18:40 – 22:30',
    done: false,
  },
]

export interface Activity {
  title: string
  cat: CatKey
  dist: string
  dur: string
  when: string
  note: string
}

/** Zelf toegevoegde wens (staat in Supabase-tabel wensen_items) */
export interface WishRow {
  id: string
  title: string
  cat: CatKey
  dur: string
  note: string
  created_by: string
}

/** Zelf toegevoegd gegeven (staat in Supabase-tabel info_items) */
export interface InfoRow {
  id: string
  title: string
  body: string
  created_by: string
}

/** Een op maat toegevoegde wens als gewone Activity tonen */
export function wishToActivity(w: WishRow): Activity {
  return { title: w.title, cat: w.cat, dist: 'eigen idee', dur: w.dur, when: '', note: w.note }
}

export const ACTIVITIES: Activity[] = [
  {
    title: 'Praça do Comércio & Rua Augusta',
    cat: 'cultuur',
    dist: '1 km',
    dur: '±1,5 uur',
    when: 'Overdag, ook goed te combineren met lunch',
    note: 'Groot plein direct aan de rivier de Taag, met de triomfboog erboven. Loop door de autovrije Rua Augusta vol terrasjes, straatartiesten en winkels tot aan het plein.',
  },
  {
    title: 'Time Out Market (Mercado da Ribeira)',
    cat: 'eten',
    dist: '1 km',
    dur: '±1,5 uur',
    when: 'Lunch of avondeten, elke dag open',
    note: 'Grote foodhal met tientallen kraampjes van bekende Lissabonse chefs — iedereen kiest zijn eigen gerecht, ideaal als de kinderen niet hetzelfde willen eten.',
  },
  {
    title: 'Miradouro de Santa Luzia',
    cat: 'uitzicht',
    dist: '2 km',
    dur: '±30 min',
    when: 'Einde van de middag, mooi licht bij zonsondergang',
    note: 'Klein uitkijkterras vol bloemen en azulejo-tegeltaferelen, met uitzicht over de daken van Alfama en de rivier.',
  },
  {
    title: 'Tram 28 door Alfama',
    cat: 'cultuur',
    dist: '2 km',
    dur: '±1 uur',
    when: 'Vroeg in de ochtend (voor 9:30) om drukte te vermijden',
    note: 'De beroemde gele houten tram klimt piepend door de smalste straatjes van de stad — een attractie op zich, gewoon vanaf je stoel.',
  },
  {
    title: 'Castelo de São Jorge',
    cat: 'uitzicht',
    dist: '2,5 km',
    dur: '±2 uur',
    when: 'Ochtend of vroege middag',
    note: 'Beklim de kasteelmuren, ontdek de binnenplaatsen en spot de pauwen die er vrij rondlopen — met het mooiste panorama over Lissabon.',
  },
  {
    title: 'Jardim Botânico / Parque Eduardo VII',
    cat: 'natuur',
    dist: '2 km',
    dur: '±1 uur',
    when: 'Rustige middag tussendoor',
    note: 'Groene long midden in de stad, fijn om even uit te rennen tussen twee bezienswaardigheden door.',
  },
  {
    title: 'LX Factory',
    cat: 'cultuur',
    dist: '3 km',
    dur: '±2,5 uur',
    when: 'Middag, ook leuk voor lunch of een ijsje',
    note: 'Voormalig fabrieksterrein onder de grote brug, nu vol met winkeltjes, streetart, een boekwinkel in een oude drukkerij en veel eetgelegenheden.',
  },
  {
    title: 'Mosteiro dos Jerónimos & Torre de Belém',
    cat: 'cultuur',
    dist: '6 km',
    dur: '±halve dag',
    when: 'Ochtend, combineer met een pastel de nata',
    note: 'Indrukwekkend kloostercomplex en de iconische verdedigingstoren aan het water — samen het hart van de wijk Belém.',
  },
  {
    title: 'Oceanário de Lisboa',
    cat: 'strand',
    dist: '7 km',
    dur: '±2,5 uur',
    when: 'Hele dag, ook fijn bij regen',
    note: 'Een van de grootste aquariums van Europa met haaien, roggen en een enorm centraal bassin.',
  },
  {
    title: 'Pavilhão do Conhecimento',
    cat: 'cultuur',
    dist: '7 km',
    dur: '±2,5 uur',
    when: 'Ochtend of regenachtige dag',
    note: 'Doe-wetenschapsmuseum waar kinderen zelf mogen experimenteren — familieticket ~€27.',
  },
  {
    title: 'Tuktuk-tour door de stad',
    cat: 'cultuur',
    dist: 'Start bij het hotel',
    dur: '±1,5 uur',
    when: 'Ochtend of einde middag',
    note: 'Een lokale chauffeur rijdt jullie in een open tuktuk langs de steile straatjes en verborgen uitkijkpunten die je te voet zou missen — leuk en makkelijk voor de kinderen.',
  },
  {
    title: 'Sintra (Palácio da Pena & Quinta da Regaleira)',
    cat: 'natuur',
    dist: '28 km',
    dur: 'hele dag',
    when: 'Vertrek vroeg (voor 9:00)',
    note: 'Sprookjesachtig kleurrijk paleis op de heuvel en een tuin met een geheime spiraalvormige put — reken op een volle dag.',
  },
  {
    title: 'Cascais strand & centrum',
    cat: 'strand',
    dist: '30 km',
    dur: 'hele dag',
    when: 'Hele dag, of alleen de middag voor het strand',
    note: 'Rustige stadsstranden, een gezellig wandelcentrum en verse vis — makkelijk bereikbaar met de directe trein.',
  },
  {
    title: 'Costa da Caparica',
    cat: 'strand',
    dist: '12 km',
    dur: '±halve dag',
    when: 'Middag, warme dag',
    note: 'Breed zandstrand aan de overkant van de brug, populair bij lokale gezinnen en iets rustiger dan de stadsstranden.',
  },
]

export interface QuizItem {
  q: string
  o: string[]
  c: number
}

export const QUIZ_SETS: QuizItem[][] = [
  [
    { q: 'Wat is de hoofdstad van Portugal?', o: ['Porto', 'Lissabon', 'Faro', 'Coimbra'], c: 1 },
    { q: 'Welke rivier stroomt door Lissabon?', o: ['Taag', 'Douro', 'Ebro', 'Guadiana'], c: 0 },
    { q: 'Wat is de officiële taal van Portugal?', o: ['Spaans', 'Portugees', 'Italiaans', 'Frans'], c: 1 },
    { q: 'Hoeveel heuvels heeft Lissabon ongeveer?', o: ['3', '5', '7', '10'], c: 2 },
    {
      q: 'Welke oceaan grenst aan Portugal?',
      o: ['Atlantische Oceaan', 'Stille Oceaan', 'Indische Oceaan', 'Noordelijke IJszee'],
      c: 0,
    },
  ],
  [
    { q: 'Hoe heet de beroemde tram die door Alfama rijdt?', o: ['Tram 12', 'Tram 28', 'Tram 5', 'Tram 15'], c: 1 },
    { q: 'Welk dier loopt vrij rond bij Castelo de São Jorge?', o: ['Pauwen', "Flamingo's", 'Papegaaien', 'Ganzen'], c: 0 },
    { q: 'Wat zie je overal op gevels in Lissabon?', o: ['Marmer', 'Azulejo-tegels', 'Hout', 'Beton'], c: 1 },
    { q: 'Wat is een "miradouro"?', o: ['Een markt', 'Een uitkijkpunt', 'Een kasteel', 'Een kerk'], c: 1 },
    {
      q: 'Wat is de bijnaam van Lissabon vanwege de heuvels?',
      o: ['Stad van het licht', 'Stad van de zeven heuvels', 'Stad van de bruggen', 'Stad van de kastelen'],
      c: 1,
    },
  ],
  [
    { q: 'Het Oceanário de Lisboa is een van de grootste...', o: ['dierentuinen', 'aquariums van Europa', 'pretparken', 'musea'], c: 1 },
    { q: 'Hoe heet de kabelbaan in Parque das Nações?', o: ['Telecabine', 'Funicular', 'Ascensor', 'Teleférico Sul'], c: 0 },
    { q: 'Wat kun je zien in het Oceanário?', o: ['Leeuwen', 'Haaien en roggen', "Dino's", 'Alleen pinguïns'], c: 1 },
    {
      q: 'Parque das Nações was ooit het terrein van...',
      o: ['een vliegveld', 'een wereldtentoonstelling (Expo 98)', 'een leger', 'een spoorwegemplacement'],
      c: 1,
    },
    { q: 'Wat is Pavilhão do Conhecimento?', o: ['Een kasteel', 'Een wetenschapsmuseum', 'Een strand', 'Een station'], c: 1 },
  ],
  [
    { q: 'Sintra ligt in de heuvels met een eigen...', o: ['woestijnklimaat', 'microklimaat', 'poolklimaat', 'geen bijzonder klimaat'], c: 1 },
    { q: 'Welke kleuren heeft het Paleis van Pena?', o: ['Blauw en wit', 'Geel en rood', 'Groen en zwart', 'Grijs'], c: 1 },
    {
      q: 'Wat is bijzonder aan Quinta da Regaleira?',
      o: ['Een zwembad', 'Een geheime spiraalvormige put', 'Een dierentuin', 'Een grot vol goud'],
      c: 1,
    },
    { q: 'Sintra staat op de...', o: ['Guinness Book of Records', 'UNESCO Werelderfgoedlijst', 'Forbes-lijst', 'geen enkele lijst'], c: 1 },
    {
      q: 'Hoe reis je het makkelijkst van Lissabon naar Sintra?',
      o: ['Met de trein', 'Met de boot', 'Te voet', 'Met de kabelbaan'],
      c: 0,
    },
  ],
  [
    { q: 'Wat is een pastel de nata?', o: ['Een soort brood', 'Een romig taartje', 'Een vissoort', 'Een drankje'], c: 1 },
    { q: 'De Torre de Belém staat aan de...', o: ['rivier de Taag', 'zee bij Porto', 'grens met Spanje', 'top van een berg'], c: 0 },
    { q: 'Het Mosteiro dos Jerónimos is een...', o: ['kasteel', 'klooster', 'paleis', 'vuurtoren'], c: 1 },
    {
      q: 'Waarvoor werden schepen vanuit Belém vroeger gebruikt?',
      o: ['Alleen vissen', 'Ontdekkingsreizen', 'Oorlog voeren', 'Vakantie vieren'],
      c: 1,
    },
    { q: 'Een Hippotrip is een voertuig dat kan...', o: ['alleen rijden', 'alleen varen', 'rijden én varen', 'vliegen'], c: 2 },
  ],
  [
    { q: 'Cascais ligt aan de...', o: ['kust bij de zee', 'in de bergen', 'in de woestijn', 'midden in het land'], c: 0 },
    {
      q: 'Hoe kom je het makkelijkst van Lissabon naar Cascais?',
      o: ['Directe trein vanaf Cais do Sodré', 'Vliegtuig', 'Kabelbaan', 'Fiets'],
      c: 0,
    },
    { q: 'Cascais was vroeger vooral een...', o: ['hoofdstad', 'vissersdorpje', 'mijnstad', 'universiteitsstad'], c: 1 },
    { q: 'Wat kun je goed doen op het strand van Cascais?', o: ['Skiën', 'Zwemmen en spelen', 'Klimmen', 'Kamperen'], c: 1 },
    {
      q: 'Welke oceaan raak je aan bij Cascais?',
      o: ['De Atlantische Oceaan', 'De Middellandse Zee', 'De Stille Oceaan', 'De Rode Zee'],
      c: 0,
    },
  ],
  [
    { q: 'LX Factory is gevestigd in oude...', o: ['kastelen', 'fabrieksgebouwen', 'kerken', 'treinstations'], c: 1 },
    { q: 'In het wetenschapsmuseum kun je vooral...', o: ['alleen kijken', 'zelf proefjes doen', 'alleen lezen', 'films kijken'], c: 1 },
    { q: 'Onder welke brug ligt LX Factory?', o: ['Ponte 25 de Abril', 'Golden Gate Bridge', 'Torre de Belém', 'Vasco da Gama-brug'], c: 0 },
    {
      q: 'De Ponte 25 de Abril lijkt op welke beroemde brug?',
      o: ['Eiffeltoren', 'Golden Gate Bridge', 'Big Ben', 'Tower Bridge'],
      c: 1,
    },
    { q: 'Wat vieren Portugezen op 25 april?', o: ['Nieuwjaar', 'De Anjerrevolutie (vrijheid)', 'Kerstmis', 'Koningsdag'], c: 1 },
  ],
  [
    { q: 'Met welke maatschappij vliegen jullie?', o: ['KLM', 'Transavia', 'Ryanair', 'TAP'], c: 1 },
    {
      q: 'Wat is de nationale lekkernij die je zeker moet proeven?',
      o: ['Croissant', 'Pastel de nata', 'Stroopwafel', 'Churros'],
      c: 1,
    },
    { q: 'Welke taal spreken de meeste mensen in Lissabon?', o: ['Spaans', 'Portugees', 'Frans', 'Engels'], c: 1 },
    { q: 'Wat is een tuktuk?', o: ['Een kleine trein', 'Een open riksja-achtig voertuigje', 'Een soort tram', 'Een boot'], c: 1 },
    { q: 'Wat neem je zeker mee naar huis?', o: ["Alleen foto's", 'Leuke herinneringen!', 'Niets', 'Alleen souvenirs'], c: 1 },
  ],
]
