/**
 * Gerenciador de Áudio Web Audio API (100% offline, procedural e sem dependência de arquivos externos)
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;

  // 🎵 Trilha Sonora Ambiente (BGM Lo-Fi Zen com Playlist e Shuffle)
  private bgmAudio: HTMLAudioElement | null = null;
  private musicEnabled: boolean = true;
  private musicVolume: number = 0.35; // ~ -9dB para manter efeitos em destaque
  private hasUserInteracted: boolean = false;
  private playlist: string[] = [
    'bgm_zen_01',
    'bgm_zen_02',
    'bgm_zen_03',
    'bgm_zen_04',
    'bgm_zen_05',
  ];
  private currentTrackIndex: number = 0;

  constructor() {
    // Escolhe aleatoriamente uma das 5 faixas para começar
    this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);

    if (typeof window !== 'undefined') {
      const unlockAudio = () => {
        this.hasUserInteracted = true;
        this.initContext();
        if (this.musicEnabled) {
          this.playBGM();
        }
      };
      window.addEventListener('pointerdown', unlockAudio, { passive: true, once: true });
      window.addEventListener('pointerup', unlockAudio, { passive: true, once: true });
      window.addEventListener('click', unlockAudio, { passive: true, once: true });
      window.addEventListener('keydown', unlockAudio, { passive: true, once: true });
    }
  }

  private initBgm(): void {
    if (this.bgmAudio || typeof window === 'undefined') return;

    this.bgmAudio = new Audio();
    this.bgmAudio.preload = 'auto';
    this.bgmAudio.volume = this.musicEnabled ? this.musicVolume : 0;

    // Quando uma faixa de 5 minutos termina, sorteia a próxima faixa (Shuffle)
    this.bgmAudio.addEventListener('ended', () => {
      this.playNextTrack();
    });

    this.loadTrack(this.playlist[this.currentTrackIndex]);
  }

  private loadTrack(trackName: string): void {
    if (!this.bgmAudio) return;
    const canPlayOgg = this.bgmAudio.canPlayType('audio/ogg; codecs="vorbis"');
    if (canPlayOgg !== '') {
      this.bgmAudio.src = `./audio/${trackName}.ogg`;
    } else {
      this.bgmAudio.src = `./audio/${trackName}.mp3`;
    }
    // Se só tiver 1 música na lista, ativa o loop nativo
    this.bgmAudio.loop = this.playlist.length === 1;
  }

  public setPlaylist(tracks: string[]): void {
    if (tracks.length === 0) return;
    this.playlist = tracks;
    if (this.bgmAudio) {
      this.bgmAudio.loop = tracks.length === 1;
    }
  }

  private playNextTrack(): void {
    if (!this.musicEnabled || !this.bgmAudio) return;

    if (this.playlist.length <= 1) {
      this.bgmAudio.currentTime = 0;
      this.bgmAudio.play().catch(() => {});
      return;
    }

    let nextIdx: number;
    do {
      nextIdx = Math.floor(Math.random() * this.playlist.length);
    } while (nextIdx === this.currentTrackIndex && this.playlist.length > 1);

    this.currentTrackIndex = nextIdx;
    this.loadTrack(this.playlist[this.currentTrackIndex]);
    this.bgmAudio.volume = this.musicVolume;
    this.bgmAudio.play().catch(() => {});
  }

  public playBGM(): void {
    if (!this.musicEnabled) return;
    this.initBgm();
    if (!this.bgmAudio) return;

    this.bgmAudio.volume = this.musicVolume;
    if (this.hasUserInteracted) {
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Bloqueio de autoplay até interação do usuário
        });
      }
    }
  }

  public pauseBGM(): void {
    if (this.bgmAudio) {
      this.bgmAudio.pause();
    }
  }

  public setMusicEnabled(enabled: boolean): void {
    this.musicEnabled = enabled;
    if (!enabled) {
      this.pauseBGM();
    } else {
      this.playBGM();
    }
  }

  public getMusicEnabled(): boolean {
    return this.musicEnabled;
  }

  public setMusicVolume(vol: number): void {
    this.musicVolume = Math.max(0, Math.min(1, vol));
    if (this.bgmAudio && this.musicEnabled) {
      this.bgmAudio.volume = this.musicVolume;
    }
  }

  public getMusicVolume(): number {
    return this.musicVolume;
  }

  private initContext(): void {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          // Autoplay policy prevented initialization before gesture
          return;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }

  /**
   * Som realista de pedra/marfim batendo suavemente (Tile Clack)
   */
  public playTileClick(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Filtro ressonante para simular o corpo denso da peça de marfim
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(8, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(350, now + 0.04);

    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);

    // Ruído percussivo sutil
    this.playTransientClick(now, 0.02);
  }

  /**
   * Som de par correto eliminado (Chime harmônico suave de relaxamento)
   */
  public playMatchSuccess(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Acorde Maior)

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(this.volume * 0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.36);
    });
  }

  /**
   * Som de peça bloqueada ou inválida (tom grave sutil sem ser agressivo)
   */
  public playBlockedSound(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Som de Reembaralhar (cascata rápida de pedras)
   */
  public playShuffleSound(): void {
    if (this.isMuted) return;
    for (let i = 0; i < 6; i++) {
      setTimeout(() => {
        this.playTileClick();
      }, i * 40);
    }
  }

  /**
   * Som de Marreta (impacto firme de pedra/marfim quebrando)
   */
  public playHammerSmash(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Thump de impacto grave
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.16);

    gain.gain.setValueAtTime(this.volume * 0.75, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.18);

    // 2. Ruído de estilhaço/crack
    const bufferSize = Math.floor(this.ctx.sampleRate * 0.08);
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1400, now);
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(this.volume * 0.45, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);
    noise.start(now);
  }

  /**
   * Som de vitória na prancha (fanfarra zen agradável)
   */
  public playVictoryFanfare(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const melody = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.5, d: 0.5 },
    ];

    let t = this.ctx.currentTime;
    melody.forEach((note) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(note.f, t);

      gain.gain.setValueAtTime(this.volume * 0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + note.d + 0.2);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + note.d + 0.22);
      t += note.d;
    });
  }

  /**
   * Som de celebração ao concluir uma onda intermediária
   */
  public playWaveSuccess(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chords = [523.25, 659.25, 783.99, 987.77, 1046.5];
    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + idx * 0.07);
      gain.gain.setValueAtTime(0, t);
      gain.gain.setValueAtTime(this.volume * 0.28, t + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.07 + 0.5);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.07);
      osc.stop(t + idx * 0.07 + 0.52);
    });
  }

  /**
   * Som de sinergia ou clima da natureza ativado
   */
  public playSynergyBonus(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.05);
      gain.gain.setValueAtTime(this.volume * 0.22, t + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.05 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t + idx * 0.05);
      osc.stop(t + idx * 0.05 + 0.42);
    });
  }

  private playTransientClick(time: number, duration: number): void {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, time);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(this.volume * 0.15, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(time);
    noise.stop(time + duration);
  }
}

export const soundManager = new SoundManager();
