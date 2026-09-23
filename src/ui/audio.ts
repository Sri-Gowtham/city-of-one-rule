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
