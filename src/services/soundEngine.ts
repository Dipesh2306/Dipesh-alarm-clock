import { SoundOption, SoundType } from '../types';

export const SOUND_OPTIONS: SoundOption[] = [
  {
    id: 'digital-beep',
    name: 'Digital Alarm Beep',
    nameHindi: 'डिजिटल बीप (क्लासिक)',
    description: 'Crisp, loud digital beep tone that penetrates sleep',
    category: 'Loud',
  },
  {
    id: 'radar-pulse',
    name: 'Radar Modern Pulse',
    nameHindi: 'स्मार्ट रडार पल्स',
    description: 'Modern smartphone rhythmic rising frequency pulse',
    category: 'Energetic',
  },
  {
    id: 'gentle-chime',
    name: 'Gentle Morning Chime',
    nameHindi: 'मधुर प्रातः घंटी (शांत)',
    description: 'Peaceful harmonic wind-chime melody with soft decay',
    category: 'Calm',
  },
  {
    id: 'retro-bell',
    name: 'Retro Mechanical Bell',
    nameHindi: 'पुरानी घंटी (तेज़ आवाज़)',
    description: 'Rapid mechanical dual-bell ringing like a classic clock',
    category: 'Classic',
  },
  {
    id: 'zen-bowl',
    name: 'Zen Singing Bowl',
    nameHindi: 'ज़ेन ध्यान बाउल (धीमी)',
    description: 'Deep meditative resonating bowl with soothing undertones',
    category: 'Calm',
  },
  {
    id: 'urgent-siren',
    name: 'Heavy Sleeper Siren',
    nameHindi: 'गहरी नींद के लिए सायरन (सुपर लाउड)',
    description: 'High energy alternating siren guaranteed to wake deep sleepers',
    category: 'Loud',
  },
];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private loopInterval: number | null = null;
  private masterGain: GainNode | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    // Lazy AudioContext initialization
  }

  public getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio(): boolean {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      // Play a tiny silent buffer to warm up mobile hardware
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      this.isUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  public isAudioUnlocked(): boolean {
    return this.isUnlocked && this.ctx !== null && this.ctx.state === 'running';
  }

  public playTone(sound: SoundType, volume: number = 0.8, gentleWake: boolean = false) {
    this.stopTone();
    this.isPlaying = true;

    const ctx = this.getContext();
    this.masterGain = ctx.createGain();
    this.masterGain.connect(ctx.destination);

    const targetVolume = Math.max(0.1, Math.min(1.0, volume));

    if (gentleWake) {
      this.masterGain.gain.setValueAtTime(0.05, ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetVolume, ctx.currentTime + 15);
    } else {
      this.masterGain.gain.setValueAtTime(targetVolume, ctx.currentTime);
    }

    // Play loop according to sound type
    this.triggerPattern(sound);
    
    // Setup repeating pattern interval
    const intervalMs = this.getPatternInterval(sound);
    this.loopInterval = window.setInterval(() => {
      if (this.isPlaying) {
        this.triggerPattern(sound);
      }
    }, intervalMs);
  }

  private getPatternInterval(sound: SoundType): number {
    switch (sound) {
      case 'digital-beep':
        return 1200;
      case 'radar-pulse':
        return 1500;
      case 'gentle-chime':
        return 2800;
      case 'retro-bell':
        return 1600;
      case 'zen-bowl':
        return 3200;
      case 'urgent-siren':
        return 1400;
      default:
        return 1500;
    }
  }

  private triggerPattern(sound: SoundType) {
    if (!this.isPlaying || !this.masterGain || !this.ctx) return;
    const ctx = this.ctx;
    const master = this.masterGain;

    try {
      switch (sound) {
        case 'digital-beep': {
          // 3 rapid square beeps (beep beep beep)
          const beeps = [0, 0.2, 0.4];
          beeps.forEach((offset) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'square';
            osc.frequency.setValueAtTime(1046.5, ctx.currentTime + offset); // C6
            
            gain.gain.setValueAtTime(0, ctx.currentTime + offset);
            gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + offset + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.12);

            osc.connect(gain);
            gain.connect(master);
            osc.start(ctx.currentTime + offset);
            osc.stop(ctx.currentTime + offset + 0.13);
          });
          break;
        }

        case 'radar-pulse': {
          // Modern smartphone radar sweep: rising pitch with low sub and ping
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator();
          const gain = ctx.createGain();

          osc1.type = 'sine';
          osc1.frequency.setValueAtTime(440, ctx.currentTime);
          osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35);

          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(880, ctx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.35);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

          osc1.connect(gain);
          osc2.connect(gain);
          gain.connect(master);

          osc1.start(ctx.currentTime);
          osc2.start(ctx.currentTime);
          osc1.stop(ctx.currentTime + 0.55);
          osc2.stop(ctx.currentTime + 0.55);

          // Second echo pulse
          setTimeout(() => {
            if (!this.isPlaying || !this.ctx || !this.masterGain) return;
            const subOsc = this.ctx.createOscillator();
            const subGain = this.ctx.createGain();
            subOsc.type = 'sine';
            subOsc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
            subOsc.frequency.exponentialRampToValueAtTime(1318.5, this.ctx.currentTime + 0.25);
            subGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
            subGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
            subOsc.connect(subGain);
            subGain.connect(this.masterGain);
            subOsc.start(this.ctx.currentTime);
            subOsc.stop(this.ctx.currentTime + 0.4);
          }, 350);
          break;
        }

        case 'gentle-chime': {
          // Melodic meditative wind chime chord: C5, E5, G5, B5, D6
          const notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
          notes.forEach((freq, i) => {
            const delay = i * 0.18;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);

            gain.gain.setValueAtTime(0, ctx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.22, ctx.currentTime + delay + 0.04);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + 1.8);

            osc.connect(gain);
            gain.connect(master);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 1.9);
          });
          break;
        }

        case 'retro-bell': {
          // Mechanical twin alarm clock: fast rapid metal clattering
          for (let i = 0; i < 14; i++) {
            const delay = i * 0.07;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'triangle';
            // Alternates between left and right bell frequency
            osc.frequency.setValueAtTime(i % 2 === 0 ? 1200 : 1450, ctx.currentTime + delay);

            gain.gain.setValueAtTime(0, ctx.currentTime + delay);
            gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + delay + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.06);

            osc.connect(gain);
            gain.connect(master);
            osc.start(ctx.currentTime + delay);
            osc.stop(ctx.currentTime + delay + 0.07);
          }
          break;
        }

        case 'zen-bowl': {
          // Resonant Tibetan singing bowl with harmonics
          const baseFreq = 261.63; // C4
          const harmonics = [1, 2.76, 5.4, 8.9];
          harmonics.forEach((mult, idx) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = idx === 0 ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(baseFreq * mult, ctx.currentTime);

            const initialAmp = 0.3 / (idx + 1);
            gain.gain.setValueAtTime(0, ctx.currentTime);
            gain.gain.linearRampToValueAtTime(initialAmp, ctx.currentTime + 0.08);
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.8);

            osc.connect(gain);
            gain.connect(master);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 2.9);
          });
          break;
        }

        case 'urgent-siren': {
          // Two-tone European emergency / intense wakeup siren
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sawtooth';

          osc.frequency.setValueAtTime(650, ctx.currentTime);
          osc.frequency.linearRampToValueAtTime(1100, ctx.currentTime + 0.5);
          osc.frequency.linearRampToValueAtTime(650, ctx.currentTime + 1.0);

          gain.gain.setValueAtTime(0.3, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1.0);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);

          osc.connect(gain);
          gain.connect(master);
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 1.25);
          break;
        }
      }
    } catch (e) {
      console.warn("Sound generation note:", e);
    }
  }

  public stopTone() {
    this.isPlaying = false;
    if (this.loopInterval !== null) {
      clearInterval(this.loopInterval);
      this.loopInterval = null;
    }
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
        this.masterGain.disconnect();
      } catch {}
      this.masterGain = null;
    }
  }

  public previewTone(sound: SoundType, durationMs: number = 3500) {
    this.playTone(sound, 0.8, false);
    setTimeout(() => {
      this.stopTone();
    }, durationMs);
  }
}

export const soundEngine = new SoundEngine();
