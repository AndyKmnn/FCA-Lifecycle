Grid Smash - the customer-side operating system for flexible grid connections. We get large loads
connected years earlier, then run the flexibility that made it possible.

Who it is for: operators of large controllable loads - charging parks, battery storage,
electrolysers, data centres - that are waiting years for a grid connection.

What a flexible connection is: a Flexible Connection Agreement (FCA) trades firmness for speed.
The grid operator connects you now; in return you accept a power limit at certain times. Three
limitation types: static (a fixed cap), dynamic (a cap that varies by season and time of day),
fully dynamic (limits sent by the operator day-ahead).

The product grows in four phases; each phase's output is the next phase's input.
1. Intelligence - operator database (terms, templates, fees, timelines per grid operator), node
   screening, FCA structuring against your load profile, offer benchmark.
   You get: you know where to connect and on what terms, before talking to any operator.
2. Transaction - draft FCA generated against your load profile, counteroffer modelling,
   negotiation support through signing.
   You get: a signed FCA, faster and on better terms.
3. Operations - an adapter to each operator's signal channel (API, portal or email, normalised),
   a compliance autopilot that dispatches your energy management system and battery, and an
   audit-grade event log.
   You get: the cap is never breached, at minimum production or revenue loss, with evidence
   that stands up in a dispute.
4. Settlement - curtailment accounting, imbalance-cost allocation, compensation claims.
   You get: financial certainty; a capped connection becomes bankable.

What it does, module by module (inputs -> technology -> outputs):
- Operator database: public operator publications, published FCA templates and model contracts
  -> document-extraction pipeline with a structured term schema -> a profile per operator: FCA
  availability, limitation types, fees, timelines.
- Node screening: public asset registers and grid expansion plans -> geospatial aggregation and
  proxy scoring of headroom per substation -> ranked candidate nodes with an expected
  curtailment profile.
- FCA structuring and benchmark: your 15-minute load profile and any offers you upload ->
  load-duration-curve and percentile analysis, curtailment simulation per FCA type -> which cap
  you can live with, what it costs, whether this offer is good, plus a draft term sheet.
- Compliance autopilot: the operator's day-ahead limits, live site load, asset states -> load
  forecasting and a constrained schedule (battery first, flexible loads second) -> a schedule
  that never crosses the cap, alarms, audit log.
- Settlement: metered 15-minute values and curtailment events -> event-to-money mapping -> a
  monthly statement both sides accept.

Value for you: time-to-power drops by years, and the cost of the cap is known before signing.
Value for the grid operator: complete, pre-qualified applications and fewer breaches in operation.

The demo follows the customer journey: where can I connect (headroom map), on what terms (upload
and term sheet), and then living with it (autopilot replay).
