/*
 * Бінарка sound prototype: cue recipes (pure data) and a Web Audio renderer.
 *
 * Design tool, not product code. It is the reference for a future `src/ui/audio.ts`
 * (see design/audio/sound-design.md, "Audio port interface"). Zero assets, no network,
 * no dependency, no Math.random, no storage: every sound is built from oscillators,
 * gains and one low-pass filter at the moment it is played.
 */

// ---------------------------------------------------------------------------
// Port (the contract the page and its tests use)
// ---------------------------------------------------------------------------

export type CueName = 'place0' | 'place1' | 'clear' | 'conflict' | 'hint' | 'win' | 'soundOn';

export const CUE_NAMES: readonly CueName[] = ['place0', 'place1', 'clear', 'conflict', 'hint', 'win', 'soundOn'];

export interface AudioPort {
  /** True when the browser has an AudioContext constructor. Fixed for the life of the port. */
  readonly available: boolean;
  /** Ask for one cue. Never throws, never blocks. No-op when muted or unavailable. */
  playCue(name: CueName): void;
  /** true: stop every sounding cue (fade of CUT_MS) and ignore playCue; false: re-arm. Never throws. */
  setMuted(muted: boolean): void;
}

/** The port for a browser with no Web Audio (and the default in jsdom). */
export const silentAudioPort: AudioPort = {
  available: false,
  playCue: () => undefined,
  setMuted: () => undefined,
};

// ---------------------------------------------------------------------------
// Cue selection (pure; the reference for the page's rule "one action, at most one cue")
// ---------------------------------------------------------------------------

/** A board action that changed the board. Given-cell clicks change nothing and never get here. */
export type BoardAction = { readonly type: 'cell'; readonly value: 0 | 1 | null } | { readonly type: 'hint'; readonly filled: boolean };

export interface BoardSnapshot {
  /** Keys "r,c" of the cells that carry aria-invalid="true" (the red highlight). */
  readonly invalid: ReadonlySet<string>;
  readonly solved: boolean;
}

/**
 * Priority: win > conflict > the action's own cue. A hint that fills nothing ("none" or "broken") is silent.
 * conflict = at least one cell is red after the action that was not red before it.
 */
export function chooseCue(action: BoardAction, before: BoardSnapshot, after: BoardSnapshot): CueName | null {
  if (action.type === 'hint' && !action.filled) return null;
  if (!before.solved && after.solved) return 'win';
  for (const key of after.invalid) if (!before.invalid.has(key)) return 'conflict';
  if (action.type === 'hint') return 'hint';
  return action.value === 0 ? 'place0' : action.value === 1 ? 'place1' : 'clear';
}

// ---------------------------------------------------------------------------
// Recipes (pure data; a Vitest test can check the budgets without any audio)
// ---------------------------------------------------------------------------

export type Channel = 'input' | 'feedback' | 'win';

export interface PartialSpec {
  readonly wave: 'sine' | 'triangle';
  /** Frequency as a multiple of the note's frequency. */
  readonly ratio: number;
  /** Gain as a fraction of the note's peak. */
  readonly gain: number;
  /** Time from the end of attack + hold down to FLOOR (exponential). */
  readonly decayMs: number;
}

export interface NoteSpec {
  /** Start, relative to the cue start. */
  readonly atMs: number;
  readonly hz: number;
  /** Optional exponential pitch glide from hz to glideToHz over glideMs. */
  readonly glideToHz?: number;
  readonly glideMs?: number;
  /** Peak gain of the note before the master gain (partials scale this). */
  readonly peak: number;
  /** Linear ramp from 0 to peak. Never below MIN_ATTACK_MS (no clicks). */
  readonly attackMs: number;
  /** Time held at peak before the decay starts. */
  readonly holdMs: number;
  readonly partials: readonly PartialSpec[];
}

export interface CueRecipe {
  readonly channel: Channel;
  readonly lowpassHz: number;
  readonly lowpassQ: number;
  readonly notes: readonly NoteSpec[];
}

/** Linear ramp from FLOOR to 0 at the end of every partial (soft release, no click). */
export const RELEASE_MS = 5;
/** Exponential ramps cannot reach 0, so they go to FLOOR (-80 dB) first. */
export const FLOOR = 0.0001;
export const MIN_ATTACK_MS = 5;
/** Longest allowed cue per channel (agent comfort rules). */
export const BUDGET_MS: Readonly<Record<Channel, number>> = { input: 120, feedback: 300, win: 1500 };
/** Upper bound for one note's peak before the master gain (sum of its partial gains times peak). */
export const MAX_NOTE_PEAK = 0.5;
/** The one place to set loudness. */
export const MASTER_GAIN = 0.7;
/** Fade used to cut a voice (same channel restarted, or mute). */
export const CUT_MS = 12;
/** Scheduling lead so the attack never starts in the past. */
export const LOOKAHEAD_MS = 5;

// Equal temperament, A4 = 440 Hz; every note is in A major (pentatonic A C# E F# B, plus D4 for the "hmm").
export const HZ = {
  C4s: 277.18,
  D4: 293.66,
  E4: 329.63,
  A4: 440.0,
  C5s: 554.37,
  E5: 659.26,
  A5: 880.0,
} as const;

/** Marimba-like bar: a sine fundamental plus a quiet, fast-dying sine at 4x (the bar's tuned overtone). */
function mallet(decayMs: number, overtoneGain: number, overtoneDecayMs: number): readonly PartialSpec[] {
  return [
    { wave: 'sine', ratio: 1, gain: 1, decayMs },
    { wave: 'sine', ratio: 4, gain: overtoneGain, decayMs: overtoneDecayMs },
  ];
}

const placeNote = (hz: number): NoteSpec => ({ atMs: 0, hz, peak: 0.3, attackMs: 6, holdMs: 0, partials: mallet(95, 0.22, 35) });

export const CUE_RECIPES: Readonly<Record<CueName, CueRecipe>> = {
  // A soft wooden tap, low bar for 0 ...
  place0: { channel: 'input', lowpassHz: 2800, lowpassQ: 0.7, notes: [placeNote(HZ.A4)] },
  // ... and a fifth higher for 1 ("1 is up").
  place1: { channel: 'input', lowpassHz: 2800, lowpassQ: 0.7, notes: [placeNote(HZ.E5)] },
  // Clearing a cell: a muffled, falling "tup", quieter than placing.
  clear: {
    channel: 'input',
    lowpassHz: 1200,
    lowpassQ: 0.7,
    notes: [{ atMs: 0, hz: HZ.E4, glideToHz: HZ.D4, glideMs: 50, peak: 0.14, attackMs: 5, holdMs: 0, partials: [{ wave: 'triangle', ratio: 1, gain: 1, decayMs: 60 }] }],
  },
  // A rule break appeared: a gentle low "hmm" that sags a semitone, slow attack, muffled. Never a buzzer.
  conflict: {
    channel: 'feedback',
    lowpassHz: 900,
    lowpassQ: 0.8,
    notes: [
      {
        atMs: 0,
        hz: HZ.D4,
        glideToHz: HZ.C4s,
        glideMs: 220,
        peak: 0.16,
        attackMs: 25,
        holdMs: 90,
        partials: [
          { wave: 'triangle', ratio: 1, gain: 1, decayMs: 140 },
          { wave: 'sine', ratio: 0.5, gain: 0.35, decayMs: 140 },
        ],
      },
    ],
  },
  // A hint filled a cell: two bars rising a fourth, "here's an idea".
  hint: {
    channel: 'feedback',
    lowpassHz: 3200,
    lowpassQ: 0.7,
    notes: [
      { atMs: 0, hz: HZ.E5, peak: 0.22, attackMs: 6, holdMs: 0, partials: mallet(170, 0.15, 50) },
      { atMs: 80, hz: HZ.A5, peak: 0.2, attackMs: 6, holdMs: 0, partials: mallet(190, 0.15, 50) },
    ],
  },
  // The win: A major arpeggio A4 C#5 E5 A5, the last bar rings with a faint octave glow.
  win: {
    channel: 'win',
    lowpassHz: 3600,
    lowpassQ: 0.7,
    notes: [
      { atMs: 0, hz: HZ.A4, peak: 0.2, attackMs: 6, holdMs: 0, partials: mallet(520, 0.18, 90) },
      { atMs: 110, hz: HZ.C5s, peak: 0.2, attackMs: 6, holdMs: 0, partials: mallet(520, 0.18, 90) },
      { atMs: 220, hz: HZ.E5, peak: 0.2, attackMs: 6, holdMs: 0, partials: mallet(520, 0.18, 90) },
      {
        atMs: 330,
        hz: HZ.A5,
        peak: 0.22,
        attackMs: 6,
        holdMs: 0,
        partials: [...mallet(880, 0.18, 120), { wave: 'sine', ratio: 2, gain: 0.08, decayMs: 880 }],
      },
    ],
  },
  // Sound switched back on: the place1 tap, so the player hears the level right away.
  soundOn: { channel: 'input', lowpassHz: 2800, lowpassQ: 0.7, notes: [placeNote(HZ.E5)] },
};

/**
 * Candidate cues that the cue sheet keeps SILENT. Only in the prototype, so the user can listen and decide.
 * resolve: the last red highlight went away.
 */
export const CANDIDATE_RECIPES: Readonly<Record<'resolve', CueRecipe>> = {
  resolve: {
    channel: 'feedback',
    lowpassHz: 2400,
    lowpassQ: 0.7,
    notes: [{ atMs: 0, hz: HZ.C5s, peak: 0.12, attackMs: 8, holdMs: 0, partials: mallet(200, 0.1, 40) }],
  },
};

/** Declared length of a cue: the latest partial end (attack + hold + decay + release). */
export function cueDurationMs(recipe: CueRecipe): number {
  let end = 0;
  for (const n of recipe.notes) {
    for (const p of n.partials) end = Math.max(end, n.atMs + n.attackMs + n.holdMs + p.decayMs + RELEASE_MS);
  }
  return end;
}

/** Upper bound of one note's peak (all partials in phase), before the master gain. */
export function notePeakBound(note: NoteSpec): number {
  return note.peak * note.partials.reduce((sum, p) => sum + p.gain, 0);
}

// ---------------------------------------------------------------------------
// Renderer (works on AudioContext and OfflineAudioContext)
// ---------------------------------------------------------------------------

export interface Voice {
  readonly bus: GainNode;
  readonly sources: readonly OscillatorNode[];
  /** Context time at which the last source stops. */
  readonly endTime: number;
}

/** Schedule one cue at context time t0 (seconds) into dest. Returns the voice so it can be cut. */
export function renderCue(ctx: BaseAudioContext, dest: AudioNode, recipe: CueRecipe, t0: number): Voice {
  const bus = ctx.createGain();
  bus.gain.value = 1;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = recipe.lowpassHz;
  filter.Q.value = recipe.lowpassQ;
  filter.connect(bus);
  bus.connect(dest);

  const sources: OscillatorNode[] = [];
  let endTime = t0;
  for (const note of recipe.notes) {
    const start = t0 + note.atMs / 1000;
    const peakAt = start + note.attackMs / 1000;
    const holdEnd = peakAt + note.holdMs / 1000;
    for (const p of note.partials) {
      const osc = ctx.createOscillator();
      osc.type = p.wave;
      osc.frequency.setValueAtTime(note.hz * p.ratio, start);
      if (note.glideToHz !== undefined && note.glideMs !== undefined) {
        osc.frequency.exponentialRampToValueAtTime(note.glideToHz * p.ratio, start + note.glideMs / 1000);
      }
      const amp = ctx.createGain();
      const peak = note.peak * p.gain;
      const decayEnd = holdEnd + p.decayMs / 1000;
      const releaseEnd = decayEnd + RELEASE_MS / 1000;
      amp.gain.setValueAtTime(0, start);
      amp.gain.linearRampToValueAtTime(peak, peakAt);
      if (note.holdMs > 0) amp.gain.setValueAtTime(peak, holdEnd);
      amp.gain.exponentialRampToValueAtTime(Math.min(FLOOR, peak), decayEnd);
      amp.gain.linearRampToValueAtTime(0, releaseEnd);
      osc.connect(amp);
      amp.connect(filter);
      osc.start(start);
      osc.stop(releaseEnd + 0.01);
      sources.push(osc);
      endTime = Math.max(endTime, releaseEnd + 0.01);
    }
  }
  return { bus, sources, endTime };
}

/** Fade a voice out over CUT_MS from `now` and stop its sources. Safe on a voice that already ended. */
export function cutVoice(voice: Voice, now: number): void {
  if (voice.endTime <= now) return;
  const end = now + CUT_MS / 1000;
  voice.bus.gain.cancelScheduledValues(now);
  voice.bus.gain.setValueAtTime(1, now);
  voice.bus.gain.linearRampToValueAtTime(0, end);
  for (const s of voice.sources) {
    try {
      s.stop(end + 0.005);
    } catch {
      // already stopped: nothing to do
    }
  }
}

// ---------------------------------------------------------------------------
// The Web Audio port
// ---------------------------------------------------------------------------

export type AudioContextCtor = new () => AudioContext;

/** Feature detection: the standard constructor, or the old Safari prefix. Never constructs anything. */
export function detectAudioContext(): AudioContextCtor | undefined {
  const g = globalThis as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
  return g.AudioContext ?? g.webkitAudioContext;
}

export interface WebAudioPortOptions {
  /** Inject a constructor (tests), or `undefined` to simulate a browser with no Web Audio. */
  AudioContext?: AudioContextCtor | undefined;
  masterGain?: number;
}

/** The prototype's port: the AudioPort contract plus two design-tool extras. */
export interface WebAudioPort extends AudioPort {
  setMasterGain(gain: number): void;
  playRecipe(recipe: CueRecipe): void;
}

/**
 * Lazy: no AudioContext exists until the first playCue or setMuted(false), and the page calls those
 * only from click handlers, so the context is always created or resumed inside a user gesture.
 */
export function createWebAudioPort(options: WebAudioPortOptions = {}): WebAudioPort {
  const Ctor = Object.hasOwn(options, 'AudioContext') ? options.AudioContext : detectAudioContext();
  let masterGain = options.masterGain ?? MASTER_GAIN;
  let ctx: AudioContext | null = null;
  let master: GainNode | null = null;
  let failed = false;
  let muted = false;
  const voices = new Map<Channel, Voice>();

  function ensure(): { ctx: AudioContext; master: GainNode } | null {
    if (Ctor === undefined || failed) return null;
    if (ctx === null || master === null) {
      try {
        ctx = new Ctor();
        master = ctx.createGain();
        master.gain.value = masterGain;
        master.connect(ctx.destination);
      } catch {
        failed = true; // e.g. too many contexts: stay silent for good, the game is unaffected
        ctx = null;
        master = null;
        return null;
      }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => undefined);
    return { ctx, master };
  }

  function cutAll(): void {
    if (ctx === null) return;
    for (const v of voices.values()) cutVoice(v, ctx.currentTime);
    voices.clear();
  }

  function playRecipe(recipe: CueRecipe): void {
    if (muted) return;
    try {
      const a = ensure();
      if (a === null) return;
      const now = a.ctx.currentTime;
      const previous = voices.get(recipe.channel);
      if (previous !== undefined) cutVoice(previous, now); // one voice per channel: rapid clicks never stack
      voices.set(recipe.channel, renderCue(a.ctx, a.master, recipe, now + LOOKAHEAD_MS / 1000));
    } catch {
      // sound is optional; never break the page
    }
  }

  return {
    available: Ctor !== undefined,
    playCue(name: CueName): void {
      playRecipe(CUE_RECIPES[name]);
    },
    setMuted(next: boolean): void {
      try {
        muted = next;
        if (next) cutAll();
        else ensure();
      } catch {
        // never break the page
      }
    },
    setMasterGain(gain: number): void {
      masterGain = gain;
      if (ctx !== null && master !== null) master.gain.setTargetAtTime(gain, ctx.currentTime, 0.01);
    },
    playRecipe,
  };
}

// ---------------------------------------------------------------------------
// Offline measurement (prototype only): render a cue and read the samples
// ---------------------------------------------------------------------------

export interface CueMeasurement {
  /** Declared length from the recipe. */
  declaredMs: number;
  /** Time of the last sample above FLOOR at the output (-80 dBFS). */
  audibleMs: number;
  peak: number;
  peakDbfs: number;
  /** Time of the peak sample. */
  peakAtMs: number;
  /** Largest sample-to-sample jump in the first 3 ms (a click shows as a big jump). */
  onsetJump: number;
  /** Absolute value of the last rendered sample (should be 0). */
  tail: number;
}

export async function measureCue(recipe: CueRecipe, masterGain: number = MASTER_GAIN, sampleRate = 48000): Promise<CueMeasurement> {
  const declaredMs = cueDurationMs(recipe);
  const length = Math.ceil(((declaredMs + 50) / 1000) * sampleRate);
  const off = new OfflineAudioContext(1, length, sampleRate);
  const master = off.createGain();
  master.gain.value = masterGain;
  master.connect(off.destination);
  renderCue(off, master, recipe, 0);
  const buffer = await off.startRendering();
  const data = buffer.getChannelData(0);
  let peak = 0;
  let peakIndex = 0;
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    const v = Math.abs(data[i] ?? 0);
    if (v > peak) {
      peak = v;
      peakIndex = i;
    }
    if (v > FLOOR) last = i;
  }
  let onsetJump = 0;
  const onsetEnd = Math.min(data.length, Math.round(0.003 * sampleRate));
  for (let i = 1; i < onsetEnd; i++) onsetJump = Math.max(onsetJump, Math.abs((data[i] ?? 0) - (data[i - 1] ?? 0)));
  return {
    declaredMs,
    audibleMs: (last / sampleRate) * 1000,
    peak,
    peakDbfs: peak > 0 ? 20 * Math.log10(peak) : -Infinity,
    peakAtMs: (peakIndex / sampleRate) * 1000,
    onsetJump,
    tail: Math.abs(data[data.length - 1] ?? 0),
  };
}
