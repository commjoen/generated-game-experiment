// Audio Manager for the game
// Handles background music, sound effects, and volume controls

interface AudioSettings {
  masterVolume: number;
  musicVolume: number;
  sfxVolume: number;
  musicEnabled: boolean;
  sfxEnabled: boolean;
}

class AudioManager {
  private audioContext: AudioContext | null = null;
  private gainNodes = {
    master: null as GainNode | null,
    music: null as GainNode | null,
    sfx: null as GainNode | null,
  };

  private backgroundMusic: HTMLAudioElement | null = null;
  private soundEffects: Map<string, HTMLAudioElement> = new Map();

  private settings: AudioSettings = {
    masterVolume: 0.7,
    musicVolume: 0.6,
    sfxVolume: 0.8,
    musicEnabled: true,
    sfxEnabled: true,
  };

  constructor() {
    this.loadSettings();
    this.initializeAudio();
  }

  private loadSettings(): void {
    const saved = localStorage.getItem('audioSettings');
    if (saved) {
      try {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      } catch (e) {
        console.warn('Failed to load audio settings:', e);
      }
    }
  }

  public saveSettings(): void {
    localStorage.setItem('audioSettings', JSON.stringify(this.settings));
  }

  private async initializeAudio(): Promise<void> {
    try {
      // Initialize audio context on user interaction
      if (typeof AudioContext !== 'undefined') {
        this.audioContext = new AudioContext();
      } else if (typeof (window as any).webkitAudioContext !== 'undefined') {
        this.audioContext = new (window as any).webkitAudioContext();
      }

      if (this.audioContext) {
        // Create gain nodes for volume control
        this.gainNodes.master = this.audioContext.createGain();
        this.gainNodes.music = this.audioContext.createGain();
        this.gainNodes.sfx = this.audioContext.createGain();

        // Connect gain nodes
        this.gainNodes.music.connect(this.gainNodes.master);
        this.gainNodes.sfx.connect(this.gainNodes.master);
        this.gainNodes.master.connect(this.audioContext.destination);

        this.updateVolumes();
      }

      // Load sound effects from data URLs (simple tones)
      this.loadSoundEffects();
    } catch (error) {
      console.warn('Failed to initialize audio:', error);
    }
  }

  private loadSoundEffects(): void {
    // Generate simple sound effects using data URLs
    const sounds = {
      jump: this.generateTone(300, 0.1, 'square'),
      collect: this.generateTone(600, 0.15, 'sine'),
      powerup: this.generateTone(800, 0.2, 'triangle'),
      death: this.generateTone(150, 0.3, 'sawtooth'),
      victory: this.generateChord([523, 659, 784], 0.5), // C major chord
    };

    for (const [name, dataUrl] of Object.entries(sounds)) {
      const audio = new (window as any).Audio(dataUrl);
      audio.volume = 0; // Will be controlled by our volume system
      this.soundEffects.set(name, audio);
    }
  }

  private generateTone(
    frequency: number,
    duration: number,
    type: OscillatorType
  ): string {
    // Create a simple tone using Web Audio API and convert to data URL
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generate audio data
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      if (type === 'sine') {
        sample = Math.sin(2 * Math.PI * frequency * t);
      } else if (type === 'square') {
        sample = Math.sin(2 * Math.PI * frequency * t) > 0 ? 1 : -1;
      } else if (type === 'triangle') {
        sample =
          (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * frequency * t));
      } else if (type === 'sawtooth') {
        sample = 2 * (frequency * t - Math.floor(frequency * t + 0.5));
      }

      // Apply envelope (fade in/out)
      const envelope =
        Math.min(t * 10, 1) * Math.max(0, 1 - (t - duration + 0.1) * 10);
      sample *= envelope * 0.3; // Reduce amplitude

      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private generateChord(frequencies: number[], duration: number): string {
    const sampleRate = 44100;
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);

    // WAV header (same as above)
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Generate chord
    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      let sample = 0;

      for (const freq of frequencies) {
        sample += Math.sin(2 * Math.PI * freq * t) / frequencies.length;
      }

      const envelope =
        Math.min(t * 5, 1) * Math.max(0, 1 - (t - duration + 0.2) * 2);
      sample *= envelope * 0.2;

      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  public async ensureAudioContext(): Promise<void> {
    if (this.audioContext && this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn('Failed to resume audio context:', error);
      }
    }
  }

  public playSound(soundName: string): void {
    if (!this.settings.sfxEnabled) return;

    const sound = this.soundEffects.get(soundName);
    if (sound) {
      this.ensureAudioContext();
      sound.volume = this.settings.masterVolume * this.settings.sfxVolume;
      sound.currentTime = 0; // Reset to beginning
      sound.play().catch((e) => console.warn('Failed to play sound:', e));
    }
  }

  public startBackgroundMusic(): void {
    if (!this.settings.musicEnabled || this.backgroundMusic) return;

    // Generate a simple looping background music
    const musicDataUrl = this.generateBackgroundMusic();
    this.backgroundMusic = new (window as any).Audio(musicDataUrl);
    if (this.backgroundMusic) {
      this.backgroundMusic.loop = true;
      this.backgroundMusic.volume =
        this.settings.masterVolume * this.settings.musicVolume;

      this.ensureAudioContext();
      this.backgroundMusic
        .play()
        .catch((e) => console.warn('Failed to play background music:', e));
    }
  }

  public stopBackgroundMusic(): void {
    if (this.backgroundMusic) {
      this.backgroundMusic.pause();
      this.backgroundMusic = null;
    }
  }

  private generateBackgroundMusic(): string {
    // Generate a simple melodic loop
    const sampleRate = 44100;
    const duration = 8; // 8 second loop
    const samples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + samples * 2);
    const view = new DataView(buffer);

    // WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + samples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, samples * 2, true);

    // Simple melody: C-E-G-F pattern
    const melody = [261.63, 329.63, 392.0, 349.23]; // C4, E4, G4, F4
    const noteLength = duration / melody.length;

    for (let i = 0; i < samples; i++) {
      const t = i / sampleRate;
      const noteIndex = Math.floor(t / noteLength) % melody.length;
      const noteTime = (t % noteLength) / noteLength;
      const frequency = melody[noteIndex];

      // Primary melody
      let sample = Math.sin(2 * Math.PI * frequency * t) * 0.3;

      // Add harmony (fifth)
      sample += Math.sin(2 * Math.PI * frequency * 1.5 * t) * 0.15;

      // Add subtle bass line
      sample += Math.sin(2 * Math.PI * frequency * 0.5 * t) * 0.1;

      // Envelope for each note
      const envelope = Math.sin(Math.PI * noteTime);
      sample *= envelope * 0.4;

      view.setInt16(44 + i * 2, sample * 32767, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  }

  private updateVolumes(): void {
    if (this.gainNodes.master) {
      this.gainNodes.master.gain.value = this.settings.masterVolume;
    }
    if (this.backgroundMusic) {
      this.backgroundMusic.volume =
        this.settings.masterVolume * this.settings.musicVolume;
    }
    // Sound effects volumes are updated when played
  }

  // Public API for volume controls
  public setMasterVolume(volume: number): void {
    this.settings.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
    this.saveSettings();
  }

  public setMusicVolume(volume: number): void {
    this.settings.musicVolume = Math.max(0, Math.min(1, volume));
    this.updateVolumes();
    this.saveSettings();
  }

  public setSfxVolume(volume: number): void {
    this.settings.sfxVolume = Math.max(0, Math.min(1, volume));
    this.saveSettings();
  }

  public setMusicEnabled(enabled: boolean): void {
    this.settings.musicEnabled = enabled;
    if (enabled) {
      this.startBackgroundMusic();
    } else {
      this.stopBackgroundMusic();
    }
    this.saveSettings();
  }

  public setSfxEnabled(enabled: boolean): void {
    this.settings.sfxEnabled = enabled;
    this.saveSettings();
  }

  // Getters for current settings
  public getMasterVolume(): number {
    return this.settings.masterVolume;
  }
  public getMusicVolume(): number {
    return this.settings.musicVolume;
  }
  public getSfxVolume(): number {
    return this.settings.sfxVolume;
  }
  public isMusicEnabled(): boolean {
    return this.settings.musicEnabled;
  }
  public isSfxEnabled(): boolean {
    return this.settings.sfxEnabled;
  }
}

// Export singleton instance
export const audioManager = new AudioManager();
