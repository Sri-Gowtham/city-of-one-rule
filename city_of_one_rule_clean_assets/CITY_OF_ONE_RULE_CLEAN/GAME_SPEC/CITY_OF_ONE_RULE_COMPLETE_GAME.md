# CITY OF ONE RULE
## Complete Game Design & Build Specification

### Tagline
**Change one rule. Watch a city change itself.**

---

# 1. Game Overview

**CITY OF ONE RULE** is a browser-based social simulation/strategy game inspired by the idea that small changes in what society rewards, observes, and repeats can create large cultural consequences.

The player becomes the temporary mayor of a fictional city.

The player does **not** directly control citizens.

Instead, the player chooses **one social rule at a time**. The city simulation then runs for a short period. Citizens, businesses, media, neighborhoods, and institutions react to that rule.

The player observes the consequences and chooses another rule.

The objective is not simply to maximize one score.

The objective is to discover what kind of society the player's rules create.

---

# 2. Core Innovation

The central mechanic is:

> **The player controls a rule, not the people.**

A rule changes incentives.

Incentives change behavior.

Behavior spreads.

Repeated behavior becomes culture.

Culture changes the city.

The city then creates new problems that influence the player's next decision.

### Core loop

```text
CHOOSE RULE
     ↓
CITY SIMULATION
     ↓
CITIZENS REACT
     ↓
BEHAVIOR SPREADS
     ↓
CITY TRANSFORMS
     ↓
NEW PROBLEMS / NEW OPPORTUNITIES
     ↓
CHOOSE NEXT RULE
```

The game should create **emergent consequences** rather than presenting a fixed "correct answer."

---

# 3. Player Experience

The player should initially think:

> "I'm just choosing a rule."

After several rounds:

> "Why did that rule cause THIS?"

By the end:

> "I created this society."

That realization is the emotional payoff.

---

# 4. Game Structure

A complete run consists of **10 eras**.

Each era:

1. Shows the current city.
2. Displays current social/economic/environmental indicators.
3. Presents a set of available rules.
4. Player selects one rule.
5. Simulation runs for approximately 45–60 seconds.
6. Citizens react.
7. Events occur.
8. City metrics change.
9. A short newspaper/social-media summary explains notable consequences.
10. Player advances to the next era.

At the end, the game generates a **Society Report** describing the civilization created by the player's decisions.

---

# 5. City

The city contains six major districts.

## 5.1 Downtown

Contains:

- Offices
- Shops
- Banks
- Restaurants
- Media buildings

High economic activity.

## 5.2 Residential

Contains:

- Apartments
- Houses
- Schools
- Parks

Main citizen population.

## 5.3 Industrial

Contains:

- Factories
- Warehouses
- Power facilities

Generates jobs, pollution, and resources.

## 5.4 Old Town

Contains:

- Small businesses
- Community centers
- Historic buildings

Strong social interactions.

## 5.5 University District

Contains:

- University
- Library
- Labs
- Student housing

High education and innovation activity.

## 5.6 Suburbs

Contains:

- Houses
- Roads
- Shopping areas

Lower population density.

---

# 6. Citizens

Each citizen has hidden and visible properties.

### Visible

- Name
- Occupation
- Mood
- Wealth
- Neighborhood
- Current activity

### Simulation attributes

```text
Trust
Ambition
Generosity
Risk tolerance
Social influence
Productivity
Stress
Environmental concern
Privacy preference
Community attachment
```

Do not expose all attributes to the player.

The player should infer behavior from what citizens actually do.

---

# 7. Citizen Archetypes

Use approximately 30–60 citizens in the initial playable build.

Examples:

### Maya
Teacher

High:

- Community attachment
- Generosity

### Arjun
Shop owner

High:

- Ambition
- Risk tolerance

### Lina
Student

High:

- Curiosity
- Social influence

### Daniel
Factory worker

High:

- Productivity
- Community attachment

### Noor
Journalist

High:

- Curiosity
- Social influence

Different citizens should react differently to the same rule.

---

# 8. Businesses

Businesses respond to citizen behavior.

Types:

- Grocery
- Restaurant
- Technology company
- Factory
- Bank
- Entertainment
- Local shop

Businesses track:

```text
Demand
Revenue
Employee satisfaction
Operating cost
Reputation
```

Rules can indirectly change these values.

Example:

If citizens become highly community-oriented:

- Local businesses may grow.
- Large chains may lose some demand.
- Community events increase.

---

# 9. Media System

The city has fictional media outlets.

Examples:

### CITYWIRE
General news.

### THE DAILY VOICE
Opinion-focused.

### MARKET WATCH
Economic news.

Media observes major changes and generates headlines.

Example:

> "LOCAL BUSINESSES SEE UNEXPECTED SURGE"

or

> "CITY TRUST RISES — BUT PRIVACY CONCERNS GROW"

Headlines are generated from simulation events.

---

# 10. Core City Metrics

The player sees six primary metrics.

```text
Happiness
Trust
Economy
Equality
Safety
Environment
```

Secondary hidden metrics:

```text
Polarization
Privacy
Innovation
Community
Stress
Institutional stability
Crime pressure
Media sensationalism
```

Avoid presenting these as a simple "good/bad" morality system.

A rule can improve one metric while damaging another.

---

# 11. Rule System

The initial game contains **15 predefined rules**.

Each rule modifies incentives and behavior rather than directly setting final outcomes.

---

## RULE 01 — NOBODY MAY LIE

Effect:

- Increases trust.
- Reduces fraud.
- Makes personal conflicts more direct.
- Changes advertising.
- Changes political communication.
- Can increase social tension because unpleasant truths are exposed.

Emergent possibility:

Citizens begin avoiding questions rather than lying.

---

## RULE 02 — EVERYONE MUST HELP ONE STRANGER EACH DAY

Effect:

- Increases community interaction.
- Increases social trust.
- Creates new relationships.

Emergent possibility:

Citizens begin performing superficial acts only to satisfy the rule.

---

## RULE 03 — NO MONEY

Effect:

- Removes conventional monetary exchange.
- Increases barter.
- Increases importance of reputation.
- Changes business behavior.

Emergent possibility:

Alternative informal currencies emerge.

---

## RULE 04 — EVERYONE WORKS ONLY FOUR HOURS

Effect:

- More free time.
- Lower traditional labor output.
- More recreation.
- More community activity.

Emergent possibility:

Businesses automate or reorganize.

---

## RULE 05 — EVERYONE GETS THE SAME BASIC INCOME

Effect:

- Reduces income inequality.
- Changes spending.
- Changes labor incentives.

Emergent possibility:

Luxury markets and alternative status systems emerge.

---

## RULE 06 — EVERYONE MUST PLANT ONE TREE

Effect:

- Increases environmental activity.
- Gradually increases vegetation.
- Creates environmental jobs.

Emergent possibility:

Neighborhoods begin competing to become greener.

---

## RULE 07 — NOBODY CAN USE THE INTERNET

Effect:

- Digital businesses decline.
- Physical communication increases.
- Local media becomes more important.

Emergent possibility:

Citizens create alternative local communication networks.

---

## RULE 08 — EVERYONE MUST LEARN ONE NEW SKILL PER MONTH

Effect:

- Increases education.
- Increases innovation.
- Creates demand for teachers and training.

Emergent possibility:

Citizens begin teaching one another.

---

## RULE 09 — NO PRIVATE PROPERTY

Effect:

- Changes housing.
- Changes ownership.
- Increases shared resources.

Emergent possibility:

New informal ownership norms develop.

---

## RULE 10 — EVERYONE MUST TELL THEIR OPINION WHEN ASKED

Effect:

- Increases transparency.
- Increases public discussion.

Emergent possibility:

People begin avoiding situations where they may be asked questions.

---

## RULE 11 — NO ADVERTISING

Effect:

- Changes business marketing.
- Reduces commercial persuasion.
- Increases word-of-mouth.

Emergent possibility:

Influencers and reputation networks become more important.

---

## RULE 12 — EVERYONE MUST SPEND ONE HOUR A DAY OUTSIDE

Effect:

- Increases public-space usage.
- Changes health/recreation patterns.
- Increases neighborhood encounters.

Emergent possibility:

Businesses move toward parks and public spaces.

---

## RULE 13 — WASTE IS TAXED HEAVILY

Effect:

- Reduces waste.
- Encourages recycling.
- Changes product design.

Emergent possibility:

Repair and reuse industries grow.

---

## RULE 14 — EVERY CITIZEN CAN VOTE ON ONE LOCAL DECISION PER DAY

Effect:

- Increases participation.
- Increases political activity.

Emergent possibility:

Citizens become overloaded and begin delegating their decisions.

---

## RULE 15 — EVERY CITIZEN MAY REWARD ONE OTHER CITIZEN PER DAY

Rewards are symbolic reputation points.

Effect:

- Increases prosocial behavior.
- Creates reputation networks.

Emergent possibility:

Citizens begin optimizing behavior for popularity.

This rule can create a powerful feedback loop:

```text
Reward
 ↓
Popular behavior
 ↓
More people imitate it
 ↓
Popularity increases
 ↓
More rewards
```

---

# 12. Important Design Principle

Do **not** hard-code:

> "Rule X always produces result Y."

Instead use weighted simulation.

Example:

```text
Trust change =
base_effect
+ citizen personality
+ neighborhood effect
+ previous culture
+ current events
+ random variation
```

This makes repeated runs different.

---

# 13. Culture Memory

The city remembers previous rules.

Example:

If the player previously selected:

> Nobody may lie.

The city develops a stronger trust culture.

If the player later removes the rule, the effect does not immediately disappear.

Instead:

```text
Rule removed
      ↓
Old culture remains
      ↓
Behavior gradually changes
```

This is crucial.

The player is shaping **culture**, not simply toggling modifiers.

---

# 14. Behavioral Contagion

Citizens can imitate nearby or influential citizens.

Example:

```text
Citizen A helps Citizen B
        ↓
Citizen C observes
        ↓
Citizen C imitates
        ↓
Citizen D observes C
        ↓
Helping behavior spreads
```

Similarly:

```text
Crime
Rumor
Generosity
Panic
Consumer trends
Environmental behavior
```

can spread.

---

# 15. Events

During simulation, random/contextual events can occur.

Examples:

- Shop opens.
- Factory closes.
- Citizen helps stranger.
- Protest begins.
- New startup launches.
- Rumor spreads.
- Neighborhood organizes cleanup.
- Crime occurs.
- Business changes strategy.
- Viral trend appears.
- Citizens create informal market.

Events should be influenced by the current culture.

---

# 16. The "Behold" Mechanic

The player has a **City Lens**.

Clicking a citizen allows the player to observe them.

The player can follow:

- a citizen
- a business
- a neighborhood
- a social trend

The game does not directly tell the player whether their rule is good.

Instead, the player sees consequences.

Example:

The player sees:

> Maya helped a stranger.

Then:

> Arjun witnessed it.

Later:

> Arjun helps another citizen.

Then:

> A local shop begins giving discounts to people who help others.

The player realizes the behavior is spreading.

---

# 17. Newspaper System

At the end of every era, generate a front page.

Example:

```text
CITY CHRONICLE

DAY 04

"HELPING BECOMES THE CITY'S NEW STATUS SYMBOL"

Local acts of kindness increased 38%.

However, citizens report that
some residents appear to be helping
mainly for recognition.
```

This makes consequences understandable without giving a score-based moral judgment.

---

# 18. Visual Style

The game should be visually distinctive.

### Recommended style

Stylized 2.5D / isometric city.

Not photorealistic.

Use:

- Clean buildings
- Animated citizens
- Roads
- Trees
- Parks
- Shops
- Vehicles
- Weather
- Day/night cycle

The city should visibly transform over time.

---

# 19. City Transformation

Rules should affect the visual environment.

Examples:

### Environmental rule

More trees appear.

### No advertising

Billboards disappear.

### No internet

Phones become less visible.

### Four-hour workday

Parks become more crowded.

### No private property

Shared housing increases.

### Community-help rule

Community centers become more active.

The player should be able to **see their rules in the city**.

---

# 20. UI

### Top bar

```text
CITY OF ONE RULE

Day 06

😊 Happiness 72
🤝 Trust 81
💰 Economy 64
⚖️ Equality 70
🛡️ Safety 66
🌳 Environment 78
```

### Bottom controls

```text
[ CITY ] [ PEOPLE ] [ BUSINESSES ] [ NEWS ]

                    [ CHOOSE NEXT RULE ]
```

### Rule selection

Show 3–5 rules at a time rather than all 15.

This makes choices meaningful.

---

# 21. Rule Discovery

Some rules should initially be locked.

Unlock them by observing specific outcomes.

Example:

If the player creates a strong community culture:

> "Community Voting" unlocks.

If environmental behavior becomes strong:

> "One Tree Per Citizen" unlocks.

This gives the game progression.

---

# 22. Endgame

After 10 eras:

## YOUR CITY HAS BECOME...

The game summarizes:

```text
CITY OF ONE RULE

Population: 4,281

Trust: 84
Happiness: 73
Economy: 68
Equality: 79
Safety: 71
Environment: 91

Dominant cultural traits:
• Community-oriented
• Environmentally conscious
• Reputation-driven

Major developments:
• 17 new community organizations
• 8 local businesses created
• 31% reduction in waste
• Reputation economy emerged
```

Then show:

### "THE RULES YOU CHOSE"

with a timeline.

---

# 23. Final Reflection

Do not say:

> "YOU CREATED A GOOD SOCIETY."

Instead:

> **"This is the society your rules produced."**

Then show:

### "What did you become what you beheld?"

This keeps the game reflective rather than judging the player's choices.

---

# 24. Replayability

Every run should differ because of:

- Citizen personalities
- Event timing
- Behavioral contagion
- Previous culture
- Business adaptation
- Rule combinations
- Random events

The player can discover combinations.

Example:

```text
No Advertising
      +
Reward One Citizen
      ↓
Reputation becomes marketing
```

Another:

```text
No Money
      +
Reward One Citizen
      ↓
Reputation becomes currency
```

This is where the game becomes deeper than simply selecting isolated rules.

---

# 25. Example Complete Run

### ERA 1

Player chooses:

**Everyone must plant one tree.**

Result:

Trees increase.

---

### ERA 2

Player notices citizens gathering in green spaces.

Chooses:

**Everyone must spend one hour outside.**

Result:

Public spaces become crowded.

---

### ERA 3

Local businesses move near parks.

Player chooses:

**No advertising.**

Result:

Word-of-mouth becomes more important.

---

### ERA 4

Citizens start recommending local businesses.

Player chooses:

**Everyone may reward one citizen per day.**

Result:

Reputation becomes valuable.

---

### ERA 5

Citizens begin helping each other for rewards.

Player notices some fake generosity.

Chooses:

**Nobody may lie.**

Result:

Fake behavior becomes harder.

But conflicts increase.

---

### ERA 6

Citizens become extremely direct.

Player chooses:

**Everyone must help one stranger.**

The existing culture amplifies it.

Now a powerful community culture emerges.

This demonstrates the most important system:

> **Rules interact with culture.**

---

# 26. What Makes This Different

The game is not primarily about:

- winning battles
- collecting coins
- defeating enemies
- reaching a finish line

It is about:

> **Creating a system and watching humans adapt to it.**

The player is effectively experimenting with society.

There is no single optimal civilization.

Different choices produce different cultures.

---

# 27. MVP Scope

For the first playable build, implement:

### World
- One city
- 4 districts
- 30 citizens
- 10 businesses

### Systems
- 10 rules initially
- Citizen AI
- Basic behavior contagion
- Business reactions
- 6 city metrics
- News generation
- 5 simulation eras
- End-of-game report

### Visuals
- Isometric city
- Animated citizens
- Trees
- Cars
- Buildings
- Parks
- Day/night

Once this works, expand toward all 15 rules and richer simulation.

---

# 28. Technical Direction

Recommended implementation for a browser prototype:

### Frontend
HTML + CSS + JavaScript

or:

React + JavaScript

### Simulation

A deterministic local simulation engine:

```text
CityState
 ├── Citizens[]
 ├── Businesses[]
 ├── Districts[]
 ├── Culture
 ├── ActiveRule
 ├── Metrics
 ├── Events[]
 └── History[]
```

### Core loop

```javascript
applyRule()
simulateCitizens()
spreadBehaviors()
simulateBusinesses()
generateEvents()
updateCulture()
updateMetrics()
generateNews()
renderCity()
```

No external backend is required for the MVP.

---

# 29. Prompt & Play Development Strategy

The competition requires the final submission PDF to contain:

**Page 1:** Game concept

**Page 2:** Complete prompts used during development.

Therefore, maintain a prompt log from the first build prompt onward.

The official guidelines explicitly require the prompts used to build the game to be disclosed in order. fileciteturn0file0L55-L70

Suggested prompt development sequence:

1. Concept generation
2. Game mechanics
3. Simulation architecture
4. Citizen behavior system
5. Rule engine
6. Culture system
7. City rendering
8. Business simulation
9. Events
10. UI
11. Balancing
12. Visual polish
13. Testing
14. Bug fixing
15. Final polish

---

# 30. The Core Philosophy

The entire game should communicate one idea without directly preaching it:

> **Small rules create incentives.**
>
> **Incentives create behavior.**
>
> **Behavior spreads.**
>
> **Repeated behavior becomes culture.**
>
> **Culture changes the world.**

The player only changes the first variable.

Everything after that emerges from the simulation.

---

# 31. One-Sentence Pitch

> **CITY OF ONE RULE is a social simulation where you can change only one rule at a time and must watch citizens, businesses, and culture adapt until your simple decisions transform an entire city.**

---

# 32. Hackathon Positioning

The innovation should be presented as:

> **"Instead of controlling characters, the player controls the incentives that control characters."**

That is the game's central differentiator.

The official competition emphasizes originality of the core idea, creativity in gameplay/design, clarity of the build process, prompting effectiveness, and engaging uniqueness. fileciteturn0file0L40-L54

---

# 33. Important Originality Boundary

This game should **not reproduce the mechanics, characters, art, interface, story, or presentation of "We Become What We Behold."**

That game can be an inspiration for thinking about feedback loops and observation, but CITY OF ONE RULE needs its own:

- mechanics
- simulation
- visual identity
- characters
- rules
- progression
- UI
- narrative framing

The competition rules require submitted work to be original and specifically created for the competition. fileciteturn0file0L72-L77
