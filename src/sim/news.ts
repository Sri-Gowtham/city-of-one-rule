import type { Sim } from "./engine";
import { ruleById } from "./rules";
import { METRIC_KEYS } from "./types";
import type { FrontPage, MetricKey } from "./types";

type Pair = [string, string];

const LINES: Record<string, Pair> = {
  help: ["Acts of kindness rose {p}%.", "Acts of kindness fell {p}%."],
  chat: ["Street conversations were up {p}%.", "Neighbors talked {p}% less."],
  argue: ["Public arguments climbed {p}%.", "Arguments dropped {p}%."],
  gossip: ["Rumors spread {p}% more often.", "Gossip fell {p}%."],
  crime: ["Reported thefts rose {p}%.", "Reported thefts fell {p}%."],
  litter: ["Littering increased {p}%.", "Littering fell {p}%."],
  plant: ["Tree planting jumped {p}%.", "Tree planting slowed {p}%."],
  volunteer: ["Volunteering jumped {p}%.", "Volunteering slipped {p}%."],
  scroll: ["Screen time rose {p}%.", "Screen time fell {p}%."],
  shopVisits: ["Shop visits rose {p}%.", "Shop visits fell {p}%."],
  teach: ["Neighbors taught each other {p}% more.", "Peer teaching fell {p}%."],
  avoid: ["Residents dodged {p}% more conversations.", "Conversation-dodging fell {p}%."],
  barter: ["Bartering rose {p}%.", "Bartering fell {p}%."],
  reward: ["Reward-giving rose {p}%.", "Reward-giving fell {p}%."],
  parkVisits: ["Park visits rose {p}%.", "Park visits fell {p}%."],
  communityVisits: ["Community center visits rose {p}%.", "Community center visits fell {p}%."],
  recycle: ["Recycling rose {p}%.", "Recycling fell {p}%."],
  vote: ["Votes cast rose {p}%.", "Votes cast fell {p}%."],
};

const HEAD: Record<string, Pair> = {
  help: ["KINDNESS ON THE RISE ACROSS THE CITY", "A COLDER CITY? KINDNESS DECLINES"],
  chat: ["THE CITY STARTS TALKING TO ITSELF AGAIN", "QUIET STREETS: NEIGHBORS STOP TALKING"],
  argue: ["TEMPERS FLARE AS ARGUMENTS SPIKE", "A CALMER CITY: ARGUMENTS FADE"],
  gossip: ["RUMOR MILL IN OVERDRIVE", "GOSSIP GOES QUIET"],
  crime: ["THEFTS RISE — RESIDENTS LOCK THEIR DOORS", "STREETS QUIETER AS THEFTS DROP"],
  litter: ["LITTER PILES UP ON CITY STREETS", "CLEANER STREETS ACROSS THE CITY"],
  plant: ["THE CITY GROWS GREENER", "PLANTING STALLS"],
  volunteer: ["VOLUNTEERS FLOOD THE COMMUNITY CENTER", "VOLUNTEERING DRIES UP"],
  scroll: ["EYES ON SCREENS: SCREEN TIME SURGES", "HEADS UP: THE CITY PUTS ITS PHONES DOWN"],
  shopVisits: ["LOCAL BUSINESSES SEE UNEXPECTED SURGE", "SHOPS GO QUIET"],
  teach: ["A CITY OF TEACHERS", "LESSONS DRY UP"],
  avoid: ["THE CITY LEARNS TO LOOK AWAY", "RESIDENTS STOP DODGING EACH OTHER"],
  barter: ["THE BARTER ECONOMY BOOMS", "BARTERING FADES"],
  reward: ["REWARDS FLOW ACROSS THE CITY", "FEWER REWARDS HANDED OUT"],
  parkVisits: ["PARKS PACKED AS THE CITY HEADS OUTDOORS", "PARKS EMPTY OUT"],
  communityVisits: ["THE COMMUNITY CENTER IS THE PLACE TO BE", "COMMUNITY CENTER GROWS QUIET"],
  recycle: ["RECYCLING SURGES", "RECYCLING SLUMPS"],
  vote: ["BALLOT FEVER GRIPS THE CITY", "TURNOUT SLUMPS"],
};

const METRIC_HEAD: Record<MetricKey, Pair> = {
  happiness: ["CITIZENS REPORT RISING SPIRITS", "MOOD DIPS ACROSS THE CITY"],
  trust: ["TRUST BETWEEN NEIGHBORS ON THE RISE", "SUSPICION GROWS AS TRUST ERODES"],
  economy: ["THE ECONOMY PICKS UP SPEED", "ECONOMIC ACTIVITY SLOWS"],
  equality: ["GAP BETWEEN RICH AND POOR NARROWS", "INEQUALITY WIDENS"],
  safety: ["STREETS FEEL SAFER, RESIDENTS SAY", "SAFETY CONCERNS TICK UPWARD"],
  environment: ["THE AIR FEELS CLEANER", "ENVIRONMENTAL WORRIES GROW"],
};

const QUOTES: Record<string, string[]> = {
  help: ["“It costs nothing, and it changes your whole day.”", "“Honestly? I just needed to tick the box today.”"],
  chat: ["“I know my neighbors' names now. I didn't last week.”"],
  argue: ["“At least now everyone says what they mean. Even when it hurts.”", "“We used to smile and nod. Now we fight about it.”"],
  gossip: ["“You didn't hear it from me, but…”"],
  crime: ["“I never used to lock my bike.”"],
  litter: ["“Somebody else will pick it up. Someone always does.”"],
  plant: ["“Our street has more trees than the next one. We're keeping it that way.”"],
  volunteer: ["“The community center feels like a second living room.”"],
  scroll: ["“I only looked up when my battery died.”"],
  shopVisits: ["“Business hasn't been this good in years.”"],
  teach: ["“I taught someone to fix a bike; they taught me to bake. Fair trade.”"],
  avoid: ["“I've started taking the long way home. Fewer questions.”"],
  barter: ["“I traded two haircuts for a week of bread.”"],
  reward: ["“Everyone's so nice now. I just wonder how much of it is for the stars.”"],
  vote: ["“Another ballot? I just ask whoever seems to know.”"],
  parkVisits: ["“The park is the city's living room now.”"],
  communityVisits: ["“With the networks down, this is where the news happens.”"],
  recycle: ["“Fixing it is cheaper than throwing it out now. Who knew?”"],
  protest: ["“We didn't agree to this rule!”"],
};

const FLAG_TOPIC: Record<string, string> = {
  "superficial-help": "help",
  "avoid-questions": "avoid",
  dodging: "avoid",
  "favor-tokens": "barter",
  "green-race": "plant",
  "local-network": "communityVisits",
  "peer-teaching": "teach",
  delegation: "vote",
  popularity: "reward",
  "word-of-mouth": "chat",
  "park-economy": "parkVisits",
  "repair-boom": "recycle",
  "sharing-norms": "argue",
  "status-symbols": "shopVisits",
  "help-discount": "help",
};

const ACTOR_KEY: Record<string, string> = { shopVisits: "shop", parkVisits: "chat", communityVisits: "volunteer" };

const NOUN: Record<string, string> = {
  help: "Acts of kindness",
  chat: "Street conversations",
  argue: "Public arguments",
  gossip: "Rumors",
  crime: "Reported thefts",
  litter: "Littering incidents",
  plant: "Trees planted",
  volunteer: "Volunteer shifts",
  scroll: "Screen sessions",
  shopVisits: "Shop visits",
  teach: "Lessons between neighbors",
  avoid: "Dodged conversations",
  barter: "Barter trades",
  reward: "Rewards given",
  parkVisits: "Park visits",
  communityVisits: "Community center visits",
  recycle: "Recycling runs",
  vote: "Votes cast",
};

const BAD: ReadonlySet<string> = new Set(["argue", "gossip", "crime", "litter", "scroll", "avoid"]);

const RULE_TOPICS: Record<string, string[]> = {
  "no-lying": ["gossip", "avoid", "argue"],
  "help-stranger": ["help"],
  "no-money": ["barter", "shopVisits"],
  "four-hour-day": ["parkVisits", "communityVisits"],
  "basic-income": ["shopVisits"],
  "plant-tree": ["plant"],
  "no-internet": ["scroll", "chat", "communityVisits"],
  "learn-skill": ["teach"],
  "no-private-property": ["argue"],
  "tell-opinion": ["avoid", "argue"],
  "no-advertising": ["shopVisits"],
  "hour-outside": ["parkVisits"],
  "waste-tax": ["recycle", "litter"],
  "daily-vote": ["vote"],
  "reward-citizen": ["reward", "help"],
};

const COMBO_IDS = new Set(["reputation-marketing", "reputation-currency", "park-life", "radical-sincerity", "town-hall", "academies", "commons", "repair-culture"]);

type Change = { k: string; pct: number; a: number; b: number; score: number; good: boolean };

function describe(c: Change): string {
  if (c.pct >= 250) return `${NOUN[c.k]}: ${c.b}, up from ${c.a}.`;
  if (c.pct <= -80) return `${NOUN[c.k]} nearly vanished — ${c.b}, down from ${c.a}.`;
  return LINES[c.k][c.pct > 0 ? 0 : 1].replace("{p}", String(Math.abs(c.pct)));
}

export function buildFrontPage(sim: Sim): FrontPage {
  const prev = sim.prevCounts ?? sim.baseCounts;
  const cur = sim.counts;
  const related = new Set(sim.activeRule ? RULE_TOPICS[sim.activeRule] ?? [] : []);
  const prevRule = sim.history.length >= 2 ? sim.history[sim.history.length - 2].ruleId : null;
  const stale = new Set(prevRule && prevRule !== sim.activeRule ? (RULE_TOPICS[prevRule] ?? []).filter((k) => !related.has(k)) : []);
  const changes = Object.keys(LINES)
    .map((k): Change | null => {
      const a = Math.round(prev[k] ?? 0);
      const b = Math.round(cur[k] ?? 0);
      if (Math.max(a, b) < 4) return null;
      const ratio = (b + 1) / (a + 1);
      const pct = Math.round((ratio - 1) * 100);
      const good = BAD.has(k) ? pct < 0 : pct > 0;
      return { k, pct, a, b, good, score: Math.abs(Math.log(ratio)) * (related.has(k) ? 1.8 : 1) };
    })
    .filter((c): c is Change => !!c && Math.abs(c.pct) >= 15)
    .sort((x, y) => y.score - x.score);
  const line = describe;
  const ups = changes.filter((c) => c.good);
  const downs = changes.filter((c) => !c.good);
  sim.emergentNotes.sort(
    (x, y) =>
      (COMBO_IDS.has(y.flag) ? 2 : y.flag === "help-discount" ? 0 : 1) -
      (COMBO_IDS.has(x.flag) ? 2 : x.flag === "help-discount" ? 0 : 1),
  );

  const metrics = METRIC_KEYS.map((key) => ({
    key,
    value: Math.round(sim.metrics[key]),
    delta: Math.round(sim.metrics[key] - sim.eraStartMetrics[key]),
  }));
  const byDelta = [...metrics].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

  const note = sim.emergentNotes[0];
  let headline: string;
  let topic: string;
  if (note) {
    headline = note.headline;
    topic = FLAG_TOPIC[note.flag] ?? changes.find((c) => c.pct > 0)?.k ?? "";
  } else if (changes.some((c) => !stale.has(c.k))) {
    const top = changes.find((c) => !stale.has(c.k))!;
    headline = HEAD[top.k][top.pct > 0 ? 0 : 1];
    topic = changes.find((c) => c.pct > 0 && !stale.has(c.k))?.k ?? "";
  } else {
    const m = byDelta[0];
    headline = m && m.delta !== 0 ? METRIC_HEAD[m.key][m.delta > 0 ? 0 : 1] : "THE CITY HOLDS ITS BREATH";
    topic = "";
  }

  const sens = sim.hidden.sensationalism;
  let outlet = "CITYWIRE";
  if (topic === "shopVisits" || topic === "barter" || byDelta[0]?.key === "economy") outlet = "MARKET WATCH";
  if (topic === "argue" || topic === "gossip" || sens > 60) outlet = "THE DAILY VOICE";
  if (sens > 72 && !headline.startsWith("SHOCK")) headline = `SHOCK: ${headline}!`;

  const rule = sim.activeRule ? ruleById(sim.activeRule) : null;
  const body: string[] = [];
  const lead = rule ? `On Day ${sim.era}, the mayor decreed: “${rule.title}.”` : `Day ${sim.era} passed without a new rule.`;
  body.push([lead, ...ups.slice(0, 2).map(line)].join(" "));
  if (note) body.push(note.body);
  if (downs.length) {
    const d = line(downs[0]);
    body.push(`However, ${d.charAt(0).toLowerCase()}${d.slice(1)}${downs[1] ? " " + line(downs[1]) : ""}`);
  }

  const stories: { title: string; text: string }[] = [];
  for (const n of sim.emergentNotes.slice(1)) stories.push({ title: n.headline, text: n.body });
  if (sim.openings.length) stories.push({ title: "NOW OPEN", text: `${sim.openings.join(", ")} opened for business.` });
  if (sim.closures.length) stories.push({ title: "CLOSED", text: `${sim.closures.join(", ")} closed ${sim.closures.length > 1 ? "their" : "its"} doors.` });
  const protests = sim.cnt("protests");
  if (protests) stories.push({ title: "PROTEST AT CITY HALL", text: `Residents rallied at City Hall ${protests === 1 ? "once" : protests + " times"} against the new rule.` });
  if (sim.bizNews.length) stories.push({ title: "MARKET WATCH", text: sim.bizNews.slice(0, 3).join(" ") });
  const rumors = sim.cnt("rumors");
  if (rumors) stories.push({ title: "RUMOR MILL", text: `${rumors} rumor${rumors > 1 ? "s" : ""} made the rounds. Reputations took a hit.` });
  const crimes = sim.cnt("crime");
  if (crimes >= 3) stories.push({ title: "POLICE BLOTTER", text: `${crimes} thefts were reported across the city.` });
  if (sim.cnt("orgs")) stories.push({ title: "NEW ORGANIZATIONS", text: `Residents formed ${sim.cnt("orgs")} new community group${sim.cnt("orgs") > 1 ? "s" : ""}.` });
  if (!stories.length && changes[1]) stories.push({ title: "ALSO TODAY", text: line(changes[1]) });

  let quote: FrontPage["quote"] = null;
  const pool = QUOTES[topic];
  const actors = sim.eraActors[(ACTOR_KEY[topic] ?? topic) as keyof typeof sim.eraActors] ?? [];
  if (pool && actors.length) {
    const c = sim.citizens[actors[Math.floor(sim.rng.next() * actors.length)]];
    const chained = c.log.filter((l) => l.era === sim.era && l.text.includes("after seeing")).pop();
    let text = pool[note?.flag === "superficial-help" ? pool.length - 1 : Math.floor(sim.rng.next() * pool.length)];
    if (chained) {
      const who = chained.text.split("after seeing ")[1]?.replace(" do it.", "");
      if (who) text = `“I saw ${who} do it, so I figured — why not me?”`;
    }
    quote = { text, by: `${c.name}, ${c.occupation.toLowerCase()}` };
  }

  const env = sim.metrics.environment;
  return {
    era: sim.era,
    outlet,
    headline,
    subhead: byDelta
      .slice(0, 3)
      .filter((m) => m.delta !== 0)
      .map((m) => `${m.key[0].toUpperCase()}${m.key.slice(1)} ${m.value} (${m.delta > 0 ? "+" : "−"}${Math.abs(m.delta)})`)
      .join(" · "),
    body,
    stories: stories.slice(0, 3),
    quote,
    ruleTitle: rule ? rule.title : "No rule",
    unlocked: sim.newlyUnlocked.map((id) => ruleById(id).title),
    weather: env >= 70 ? "Clear skies, fresh air" : env >= 50 ? "Mild, light breeze" : "Hazy — smog advisory",
    metrics,
  };
}
