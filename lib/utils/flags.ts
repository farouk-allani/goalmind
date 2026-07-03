// GoalMind — National Team Flags
// Pure, offline, zero-dependency emoji flag lookup. Matches are World Cup
// national teams, so both sample data (lib/data/football.ts) and the live
// football-data.org client (lib/api/football.ts, World Cup 2026 competition)
// key teams by country name — one lookup table covers both.

/** ISO 3166-1 alpha-2 code -> flag emoji, via Unicode regional indicators. */
function countryCodeToFlagEmoji(iso2: string): string {
  const code = iso2.toUpperCase();
  if (code.length !== 2) return '';
  const A = 0x1f1e6;
  const chars = [...code].map((c) => A + (c.charCodeAt(0) - 65));
  return String.fromCodePoint(...chars);
}

// Home nations without an ISO 3166-1 code use their full subdivision flag sequence.
const SPECIAL_FLAGS: Record<string, string> = {
  ENGLAND: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}',
  SCOTLAND: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}',
  WALES: '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}',
};

// Name/code -> ISO 3166-1 alpha-2. Keys are matched case-insensitively.
// Covers the sample teams plus the common World Cup 2026 footballing nations.
const COUNTRY_TO_ISO2: Record<string, string> = {
  argentina: 'AR', arg: 'AR',
  france: 'FR', fra: 'FR',
  brazil: 'BR', bra: 'BR',
  germany: 'DE', ger: 'DE', deu: 'DE',
  spain: 'ES', esp: 'ES',
  portugal: 'PT', por: 'PT',
  netherlands: 'NL', ned: 'NL', nld: 'NL', holland: 'NL',
  belgium: 'BE', bel: 'BE',
  italy: 'IT', ita: 'IT',
  croatia: 'HR', cro: 'HR',
  uruguay: 'UY', uru: 'UY',
  colombia: 'CO', col: 'CO',
  morocco: 'MA', mar: 'MA',
  japan: 'JP', jpn: 'JP',
  'south korea': 'KR', kor: 'KR', korea: 'KR',
  mexico: 'MX', mex: 'MX',
  usa: 'US', 'united states': 'US', 'united states of america': 'US', us: 'US',
  canada: 'CA', can: 'CA',
  switzerland: 'CH', sui: 'CH', swi: 'CH',
  denmark: 'DK', den: 'DK',
  senegal: 'SN', sen: 'SN',
  ghana: 'GH', gha: 'GH',
  nigeria: 'NG', nga: 'NG',
  cameroon: 'CM', cmr: 'CM',
  tunisia: 'TN', tun: 'TN',
  algeria: 'DZ', alg: 'DZ',
  egypt: 'EG', egy: 'EG',
  'ivory coast': 'CI', civ: 'CI', "cote d'ivoire": 'CI',
  poland: 'PL', pol: 'PL',
  serbia: 'RS', srb: 'RS',
  sweden: 'SE', swe: 'SE',
  norway: 'NO', nor: 'NO',
  austria: 'AT', aut: 'AT',
  ukraine: 'UA', ukr: 'UA',
  turkey: 'TR', tur: 'TR', turkiye: 'TR',
  greece: 'GR', gre: 'GR',
  wales: 'WALES',
  scotland: 'SCOTLAND',
  england: 'ENGLAND',
  'northern ireland': 'GB',
  'republic of ireland': 'IE', ireland: 'IE', irl: 'IE',
  russia: 'RU', rus: 'RU',
  chile: 'CL', chi: 'CL',
  peru: 'PE', per: 'PE',
  ecuador: 'EC', ecu: 'EC',
  paraguay: 'PY', par: 'PY',
  venezuela: 'VE', ven: 'VE',
  bolivia: 'BO', bol: 'BO',
  'costa rica': 'CR', crc: 'CR',
  panama: 'PA', pan: 'PA',
  jamaica: 'JM', jam: 'JM',
  'saudi arabia': 'SA', ksa: 'SA',
  qatar: 'QA', qat: 'QA',
  iran: 'IR', irn: 'IR',
  iraq: 'IQ', irq: 'IQ',
  australia: 'AU', aus: 'AU',
  'new zealand': 'NZ', nzl: 'NZ',
  china: 'CN', chn: 'CN',
  india: 'IN', ind: 'IN',
  finland: 'FI', fin: 'FI',
  iceland: 'IS', isl: 'IS',
  hungary: 'HU', hun: 'HU',
  romania: 'RO', rou: 'RO',
  slovakia: 'SK', svk: 'SK',
  slovenia: 'SI', svn: 'SI',
  'czech republic': 'CZ', cze: 'CZ', czechia: 'CZ',
  'south africa': 'ZA', rsa: 'ZA',
};

/** Normalize a team/country string for lookup. */
function normalize(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Get the flag emoji for a national team, given either its full name
 * (e.g. "Argentina") or a short code (e.g. "ARG"/"AR"). Falls back to a
 * neutral flag if the team isn't in the lookup, so layout never breaks.
 */
export function getTeamFlag(name: string | undefined | null): string {
  if (!name) return '\u{1F3F3}\u{FE0F}';

  const key = normalize(name);
  const iso2 = COUNTRY_TO_ISO2[key] ?? (key.length === 2 ? key.toUpperCase() : undefined);

  if (iso2 && SPECIAL_FLAGS[iso2]) return SPECIAL_FLAGS[iso2];
  if (iso2 && iso2.length === 2) return countryCodeToFlagEmoji(iso2);

  return '\u{1F3F3}\u{FE0F}'; // generic white flag fallback
}
