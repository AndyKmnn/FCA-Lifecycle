/**
 * What a connection seeker is walking into, country by country.
 *
 * This is the one layer of the tool built on public record rather than on
 * constructed data. Every entry below is something a regulator, a system
 * operator or a court actually published, with the source on the entry, and
 * countries we have not checked say so rather than being coloured in.
 *
 * That split is deliberate and worth keeping: the top of the funnel is
 * verifiable, the bottom of it - free capacity at a node, and who is queued in
 * front of you - is the part nobody publishes and the reason the venture
 * exists. A map that fabricated the top as well would give away the one place
 * it can be checked.
 *
 * Retrieved 20 September 2026.
 */

export type Access =
  /** Connections are being refused or queued behind years of waiting. */
  | 'closed'
  /** Possible, but under a published constraint or a special regime. */
  | 'constrained'
  /** A flexible connection instrument exists and is in force. */
  | 'flexible'
  /** Not researched. Shown as such rather than guessed. */
  | 'unassessed'

export interface CountryAccess {
  code: string
  name: string
  access: Access
  /** The single line that goes on screen. */
  headline: string
  /** The specifics, for the panel. */
  detail: string
  source?: { label: string; url: string }
}

export const ACCESS_LABEL: Record<Access, string> = {
  closed: 'Effectively closed',
  constrained: 'Published constraint',
  flexible: 'Flexible connections in force',
  unassessed: 'Not assessed',
}

export const EUROPE_ACCESS: Record<string, CountryAccess> = {
  DE: {
    code: 'DE',
    name: 'Germany',
    access: 'flexible',
    headline: 'Flexible connections in force since February 2025',
    detail:
      'Section 17(2b) EnWG lets any connection customer take a capped connection, technology-open, in force since 25 February 2025. Operators are not obliged to offer one - the Netzanschlusspaket would change that, and brings capacity maps for anything from 135 kW on 1 January 2028.',
    source: { label: '§ 17 EnWG', url: 'https://www.buzer.de/17_EnWG.htm' },
  },
  NL: {
    code: 'NL',
    name: 'Netherlands',
    access: 'closed',
    headline: 'Randstad declared congested; 10-year waits in Noord-Holland',
    detail:
      'TenneT has declared a formal congestion zone covering the entire Randstad. Over 3,600 MW of new industrial and data centre connections sit on a waiting list, and parts of Noord-Holland quote up to ten years for a new or upgraded connection. The Capaciteitskaart publishes which areas are full.',
    source: {
      label: 'Taylor Wessing, grid capacity in the Dutch energy sector',
      url: 'https://www.taylorwessing.com/en/insights-and-events/insights/2025/05/grid-capacity-in-the-dutch-energy-sector',
    },
  },
  IE: {
    code: 'IE',
    name: 'Ireland',
    access: 'closed',
    headline: 'Dublin effectively shut to new data centres since 2021',
    detail:
      'An effective moratorium on new data centre connections has been in place since 2021 and Dublin capacity remains extremely tight. The CRU has since published a new connection policy, and the system operators were required to publish a connection process for data centre applicants by 31 March 2026.',
    source: {
      label: 'CRU decision on data centre connection policy',
      url: 'https://www.cru.ie/about-us/news/the-cru-publishes-its-decision-on-new-electricity-connection-policy-for-data-centres/',
    },
  },
  DK: {
    code: 'DK',
    name: 'Denmark',
    access: 'constrained',
    headline: 'Grid pause under data centre demand',
    detail:
      'Surging data centre demand has pushed Denmark into pausing parts of its connection pipeline while the grid catches up.',
    source: {
      label: 'CNBC, May 2026',
      url: 'https://www.cnbc.com/2026/05/04/denmark-data-centers-moratorium-grid-pause-power-demand.html',
    },
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    access: 'constrained',
    headline: 'Connections queue under reform',
    detail:
      'The connections queue is published and is being reformed to clear speculative projects that hold places ahead of shovel-ready ones - the same problem the German section 17b priority rules are aimed at.',
    source: {
      label: 'Eurelectric on connection queues',
      url: 'https://www.eurelectric.org/blog/gridlock-to-grid-growth/',
    },
  },
}

/** The headline that frames the whole map. */
export const EUROPE_CONTEXT = {
  headline: 'Over 1.7 TW of projects are stuck in connection queues across Europe',
  detail:
    'Only two member states have run a full data centre moratorium - the Netherlands and Ireland - and both have since eased it under conditions. Connection queue reform is now on the European Commission’s grid agenda.',
  source: {
    label: 'Energy-Storage.news, December 2025',
    url: 'https://www.ess-news.com/2025/12/09/energy-storage-europe-association-grid-connection-reform-priority-lanes-storage-flexible-connection-agreements-cable-pooling-hybrid-connections/',
  },
}

export const accessOf = (code: string): CountryAccess =>
  EUROPE_ACCESS[code] ?? {
    code,
    name: code,
    access: 'unassessed',
    headline: 'Not assessed',
    detail:
      'We have not researched this market. It is shown grey rather than coloured in, because a map that guesses at the layer you can check gives away the layer you cannot.',
  }
