// Web Audio API synthesizer for interactive Windows UI & ambient audio cues

let activeCtx: AudioContext | null = null;
let stopTimer: number | null = null;

export function stopSynthAudio() {
  if (stopTimer !== null) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (activeCtx) {
    try {
      activeCtx.close();
    } catch {
      // ignore
    }
    activeCtx = null;
  }
}

export function playSynthPreset(
  preset: 'fluent-chime' | 'ambient-pad' | 'tactile-click',
  onEnded?: () => void
) {
  stopSynthAudio();
  const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    onEnded?.();
    return;
  }
  const ctx = new AudioCtx();
  activeCtx = ctx;
  const now = ctx.currentTime;

  if (preset === 'fluent-chime') {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.14);
      gain.gain.setValueAtTime(0.001, now + idx * 0.14);
      gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.14 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.14 + 0.9);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.14);
      osc.stop(now + idx * 0.14 + 0.95);
    });
    stopTimer = window.setTimeout(() => {
      stopSynthAudio();
      onEnded?.();
    }, 1600);
  } else if (preset === 'ambient-pad') {
    const chord = [220, 277.18, 329.63, 415.3];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.6);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 2.8);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 2.9);
    });
    stopTimer = window.setTimeout(() => {
      stopSynthAudio();
      onEnded?.();
    }, 2950);
  } else {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.06);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
    stopTimer = window.setTimeout(() => {
      stopSynthAudio();
      onEnded?.();
    }, 250);
  }
}
