let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let hum: GainNode | null = null;
let muted = (() => {
  try {
    return localStorage.getItem("cor-muted") === "1";
  } catch {
    return false;
  }
})();

export function isMuted() {
  return muted;
}

export function setMuted(m: boolean) {
  muted = m;
  try {
    localStorage.setItem("cor-muted", m ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
  if (master && ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.1);
}

export function startAudio() {
  if (ctx) {
    void ctx.resume();
    return;
  }
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = muted ? 0 : 0.5;
  master.connect(ctx.destination);
  const len = ctx.sampleRate * 2;
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < len; i++) {
    last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
    d[i] = last * 3;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.loop = true;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 500;
  hum = ctx.createGain();
  hum.gain.value = 0.12;
  src.connect(lp).connect(hum).connect(master);
  src.start();
}

export function setHumForHour(hour: number, running: boolean) {
  if (!hum || !ctx) return;
  const day = hour > 7 && hour < 21 ? 1 : 0.4;
  hum.gain.setTargetAtTime(running ? 0.12 * day : 0.04, ctx.currentTime, 0.5);
}

function tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0, slide = 0) {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + delay;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
}

export type Cue = "help" | "crime" | "protest" | "emergent" | "rule" | "paper" | "click" | "opening";

export function play(cue: Cue) {
  switch (cue) {
    case "help":
      tone(880, 0.18, "sine", 0.05, 0, 1.3);
      break;
    case "crime":
      tone(180, 0.35, "sawtooth", 0.05, 0, 0.6);
      break;
    case "protest":
      tone(220, 0.25, "square", 0.04);
      tone(196, 0.3, "square", 0.04, 0.2);
      break;
    case "emergent":
      [523, 659, 784].forEach((f, i) => tone(f, 0.5, "triangle", 0.06, i * 0.09));
      break;
    case "opening":
      tone(660, 0.2, "triangle", 0.05);
      tone(990, 0.3, "triangle", 0.05, 0.12);
      break;
    case "rule":
      [392, 523, 659, 784].forEach((f, i) => tone(f, 0.7, "sine", 0.07, i * 0.07));
      break;
    case "paper":
      tone(1200, 0.25, "triangle", 0.03, 0, 0.3);
      break;
    case "click":
      tone(600, 0.06, "sine", 0.04);
      break;
  }
}

function noise(dur: number, vol: number, freq: number, q = 1, delay = 0, type: BiquadFilterType = "bandpass") {
  if (!ctx || !master || muted) return;
  const t = ctx.currentTime + delay;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(master);
  src.start(t);
}

function chirp(delay = 0) {
  const base = 2200 + Math.random() * 1400;
  for (let i = 0; i < 3; i++) tone(base + i * 120, 0.07, "sine", 0.025, delay + i * 0.09, 1.35);
}

const chord = (freqs: number[], dur: number, type: OscillatorType, vol: number, gap = 0.06) =>
  freqs.forEach((f, i) => tone(f, dur, type, vol, i * gap));

export function playRule(id: string) {
  switch (id) {
    case "no-lying":
      tone(140, 0.25, "square", 0.08, 0, 0.7);
      tone(140, 0.25, "square", 0.08, 0.3, 0.7);
      noise(0.08, 0.2, 1800, 2, 0);
      break;
    case "help-stranger":
      chord([349, 440, 523, 698], 1.1, "sine", 0.06, 0.1);
      break;
    case "no-money":
      [1568, 1319, 1047, 784].forEach((f, i) => tone(f, 0.25, "triangle", 0.06, i * 0.1));
      tone(98, 0.6, "sine", 0.08, 0.45);
      break;
    case "four-hour-day":
      [0, 0.45, 0.9, 1.35].forEach((d) => tone(784, 0.9, "sine", 0.06, d, 0.998));
      break;
    case "basic-income":
      for (let i = 0; i < 6; i++) tone(2000 + Math.random() * 800, 0.12, "triangle", 0.04, i * 0.07);
      chord([523, 659, 784], 0.8, "sine", 0.05, 0.02);
      break;
    case "plant-tree":
      noise(0.5, 0.15, 400, 0.5, 0, "lowpass");
      chirp(0.3);
      chirp(0.7);
      break;
    case "no-internet":
      tone(880, 0.9, "sawtooth", 0.05, 0, 0.12);
      noise(0.4, 0.12, 3000, 0.7, 0);
      break;
    case "learn-skill":
      for (let i = 0; i < 8; i++) tone(i % 2 ? 1175 : 1319, 0.08, "triangle", 0.05, i * 0.08);
      break;
    case "no-private-property":
      tone(180, 0.5, "sawtooth", 0.05, 0, 1.6);
      noise(0.15, 0.2, 900, 3, 0.45);
      break;
    case "tell-opinion":
      for (let i = 0; i < 10; i++) noise(0.05, 0.12, 2500 + Math.random() * 1500, 4, i * 0.06);
      break;
    case "no-advertising":
      noise(0.6, 0.18, 2500, 0.5, 0);
      tone(1000, 0.08, "square", 0.05, 0.62);
      break;
    case "hour-outside":
      noise(1, 0.08, 600, 0.4, 0, "lowpass");
      chirp(0.1);
      chirp(0.5);
      chirp(0.9);
      break;
    case "waste-tax":
      tone(1400, 0.1, "square", 0.05, 0);
      tone(1800, 0.3, "triangle", 0.06, 0.12);
      noise(0.2, 0.2, 5000, 1, 0.12);
      break;
    case "daily-vote":
      noise(0.1, 0.2, 700, 2, 0);
      tone(300, 0.2, "sine", 0.07, 0.08, 0.5);
      chord([392, 494, 587], 0.6, "triangle", 0.05, 0.08);
      break;
    case "reward-citizen":
      [1047, 1319, 1568, 2093].forEach((f, i) => tone(f, 0.4, "sine", 0.05, i * 0.07));
      break;
    default:
      play("rule");
  }
}

let ambTimer: number | null = null;
let ambRule: string | null = null;

function ambientTick(rule: string) {
  switch (rule) {
    case "plant-tree":
    case "hour-outside":
      chirp();
      break;
    case "no-internet":
    case "tell-opinion":
      noise(1.2, 0.05, 500 + Math.random() * 300, 0.8);
      break;
    case "daily-vote":
      noise(0.08, 0.1, 700, 2);
      break;
    case "basic-income":
    case "no-money":
      tone(1800 + Math.random() * 900, 0.1, "triangle", 0.02);
      break;
    case "learn-skill":
      tone([523, 587, 659, 784][Math.floor(Math.random() * 4)], 0.3, "triangle", 0.025);
      break;
    case "four-hour-day":
      tone(392, 0.8, "sine", 0.02);
      break;
    case "waste-tax":
      noise(0.15, 0.08, 1500, 1);
      break;
    case "help-stranger":
    case "reward-citizen":
      tone(1319, 0.3, "sine", 0.02, 0, 1.2);
      break;
    default:
      break;
  }
}

export function setRuleAmbience(rule: string | null) {
  if (rule === ambRule) return;
  ambRule = rule;
  if (ambTimer !== null) window.clearInterval(ambTimer);
  ambTimer = null;
  if (!rule) return;
  ambTimer = window.setInterval(() => {
    if (Math.random() < 0.6) ambientTick(rule);
  }, 2600);
}
