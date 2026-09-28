import { TileAudioTimbre } from '../core/nature/tiles/TileTypes';

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
    webkitOfflineAudioContext?: typeof OfflineAudioContext;
  }
}

/**
 * Gerenciador de Áudio Web Audio API (100% offline, procedural e sem dependência de arquivos externos)
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.8;
  private clackBuffers: Map<string, AudioBuffer> = new Map();
  private matchBuffers: Map<string, AudioBuffer> = new Map();
  private isPreRenderingClacks: boolean = false;

  // 🎵 Trilha Sonora Ambiente (BGM Lo-Fi Zen com Playlist e Shuffle)
  private bgmAudio: HTMLAudioElement | null = null;
  private musicEnabled: boolean = true;
  private musicVolume: number = 0.35; // ~ -9dB para manter efeitos em destaque
  private hasUserInteracted: boolean = false;
  private playlist: string[] = [
    'bgm_lofi_01.mp3',
    'bgm_lofi_02.mp3',
    'bgm_lofi_03.mp3',
    'bgm_lofi_04.mp3',
    'bgm_lofi_05.mp3',
    'bgm_lofi_06.mp3',
    'bgm_lofi_07.mp3',
    'bgm_lofi_08.mp3',
    'bgm_lofi_09.mp3',
    'bgm_lofi_10.mp3',
    'bgm_lofi_11.mp3',
    'bgm_lofi_12.mp3',
    'bgm_lofi_13.mp3',
    'bgm_lofi_14.mp3',
    'bgm_lofi_15.mp3',
    'bgm_lofi_16.mp3',
    'bgm_lofi_17.mp3',
    'bgm_lofi_18.mp3',
    'bgm_lofi_19.mp3',
    'bgm_lofi_20.mp3',
    'bgm_lofi_21.mp3',
    'bgm_lofi_22.mp3',
    'bgm_lofi_23.mp3',
    'bgm_lofi_24.mp3',
    'bgm_zen_01.mp3',
    'bgm_zen_02.mp3',
    'bgm_zen_03.mp3',
    'bgm_zen_04.mp3',
    'bgm_zen_05.mp3',
  ];
  private currentTrackIndex: number = 0;

  constructor() {
    // Escolhe aleatoriamente uma das faixas para começar
    this.currentTrackIndex = Math.floor(Math.random() * this.playlist.length);

    if (typeof window !== 'undefined') {
      // 1. Pré-aquece o AudioContext em background para que a negociação de driver de áudio não ocorra no primeiro toque
      try {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx && !this.ctx) {
          this.ctx = new AudioCtx();
        }
      } catch {
        // Silencia em ambientes onde criação imediata sem interação for bloqueada
      }

      // 2. Pré-aloca o elemento de áudio BGM de forma assíncrona
      setTimeout(() => {
        try {
          this.initBgm();
        } catch {
          // Silencia
        }
      }, 150);

      // 3. Pré-renderiza os buffers de clack com OfflineAudioContext (Zero DSP em runtime)
      setTimeout(() => {
        try {
          this.preRenderClackBuffers();
        } catch {
          // Silencia
        }
      }, 50);

      // 4. Desbloqueio antecipado no pointerdown (já prepara o áudio antes do pointerup disparar)
      const unlockEvents = ['pointerdown', 'touchstart', 'pointerup', 'touchend', 'click', 'keydown'];
      const unlockAudio = () => {
        this.hasUserInteracted = true;
        unlockEvents.forEach((evt) => window.removeEventListener(evt, unlockAudio));

        // Retoma o AudioContext de forma instantânea (< 1ms)
        if (this.ctx && this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        } else if (!this.ctx) {
          this.initContext();
        }

        // Inicia a música de fundo fora da thread crítica do evento de toque
        if (this.musicEnabled) {
          setTimeout(() => {
            this.playBGM();
          }, 0);
        }
      };

      unlockEvents.forEach((evt) => {
        window.addEventListener(evt, unlockAudio, { passive: true, once: true });
      });
    }
  }

  private initBgm(): void {
    if (this.bgmAudio || typeof window === 'undefined') return;

    this.bgmAudio = new Audio();
    this.bgmAudio.preload = 'auto';
    this.bgmAudio.volume = this.musicEnabled ? this.musicVolume : 0;

    // Quando uma faixa termina, sorteia a próxima faixa (Shuffle)
    this.bgmAudio.addEventListener('ended', () => {
      this.playNextTrack();
    });

    this.loadTrack(this.playlist[this.currentTrackIndex]);
  }

  private loadTrack(trackName: string): void {
    if (!this.bgmAudio) return;

    if (trackName.endsWith('.mp3') || trackName.endsWith('.ogg')) {
      this.bgmAudio.src = `./audio/${trackName}`;
    } else {
      const canPlayOgg = this.bgmAudio.canPlayType('audio/ogg; codecs="vorbis"');
      if (canPlayOgg !== '') {
        this.bgmAudio.src = `./audio/${trackName}.ogg`;
      } else {
        this.bgmAudio.src = `./audio/${trackName}.mp3`;
      }
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

  public playNextTrack(): void {
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

  /**
   * Sorteia e reproduz uma nova trilha aleatória (Shuffle) para o início de uma fase
   */
  public playRandomTrack(): void {
    if (!this.musicEnabled) return;
    this.initBgm();
    if (!this.bgmAudio) return;

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
    this.bgmAudio.currentTime = 0;
    this.bgmAudio.volume = this.musicVolume;

    if (this.hasUserInteracted) {
      const playPromise = this.bgmAudio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {});
      }
    }
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

  private wasBgmPlayingBeforeSuspend: boolean = false;

  public suspend(): void {
    if (this.bgmAudio && !this.bgmAudio.paused) {
      this.wasBgmPlayingBeforeSuspend = true;
      this.bgmAudio.pause();
    } else {
      this.wasBgmPlayingBeforeSuspend = false;
    }
    if (this.ctx && this.ctx.state === 'running') {
      this.ctx.suspend().catch(() => {});
    }
  }

  public resume(): void {
    if (this.wasBgmPlayingBeforeSuspend && this.musicEnabled && this.bgmAudio) {
      this.bgmAudio.play().catch(() => {});
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
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

  private canResumeAudio(): boolean {
    if (this.hasUserInteracted) return true;
    if (typeof navigator !== 'undefined' && 'userActivation' in navigator) {
      return (navigator as { userActivation?: { hasBeenActive: boolean } }).userActivation?.hasBeenActive ?? false;
    }
    return false;
  }

  private initContext(): void {
    if (typeof window === 'undefined') return;

    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        try {
          this.ctx = new AudioCtx();
        } catch {
          return;
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended' && this.canResumeAudio()) {
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
   * Pré-sintetiza buffers PCM estáticos para os 5 timbres de clack usando OfflineAudioContext.
   * Elimina alocação de osciladores, filtros biquad e rampas DSP a cada clique no tabuleiro.
   */
  public async preRenderClackBuffers(): Promise<void> {
    if (this.isPreRenderingClacks || typeof window === 'undefined') return;
    const OfflineCtx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;
    if (!OfflineCtx) return;

    this.isPreRenderingClacks = true;
    const timbres = [
      { name: 'zen', centerFreq: 2200, baseFreq: 1400, endFreq: 350, qFactor: 8, duration: 0.05 },
      { name: 'water', centerFreq: 1800, baseFreq: 1200, endFreq: 420, qFactor: 6, duration: 0.055 },
      { name: 'wood', centerFreq: 1250, baseFreq: 950, endFreq: 260, qFactor: 10, duration: 0.04 },
      { name: 'crystal', centerFreq: 3100, baseFreq: 1900, endFreq: 700, qFactor: 12, duration: 0.06 },
      { name: 'leaf', centerFreq: 2100, baseFreq: 1350, endFreq: 320, qFactor: 7, duration: 0.045 },
    ];

    const sampleRate = 44100;

    for (const t of timbres) {
      try {
        const totalDuration = t.duration + 0.02;
        const length = Math.ceil(sampleRate * totalDuration);
        const offlineCtx = new OfflineCtx(1, length, sampleRate);

        // 1. Oscilador principal
        const osc = offlineCtx.createOscillator();
        const filter = offlineCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(t.centerFreq, 0);
        filter.Q.setValueAtTime(t.qFactor, 0);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(t.baseFreq, 0);
        osc.frequency.exponentialRampToValueAtTime(t.endFreq, t.duration * 0.8);

        const oscGain = offlineCtx.createGain();
        oscGain.gain.setValueAtTime(0.7, 0);
        oscGain.gain.exponentialRampToValueAtTime(0.001, t.duration);

        osc.connect(filter);
        filter.connect(oscGain);
        oscGain.connect(offlineCtx.destination);

        osc.start(0);
        osc.stop(t.duration);

        // 2. Ruído percussivo de impacto
        const transientDuration = 0.02;
        const transientLength = Math.ceil(sampleRate * transientDuration);
        const noiseBuf = offlineCtx.createBuffer(1, transientLength, sampleRate);
        const noiseData = noiseBuf.getChannelData(0);
        for (let i = 0; i < transientLength; i++) {
          noiseData[i] = Math.random() * 2 - 1;
        }

        const noise = offlineCtx.createBufferSource();
        noise.buffer = noiseBuf;

        const noiseFilter = offlineCtx.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(3000, 0);

        const noiseGain = offlineCtx.createGain();
        noiseGain.gain.setValueAtTime(0.15, 0);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, transientDuration);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(offlineCtx.destination);

        noise.start(0);
        noise.stop(transientDuration);

        const renderedBuffer = await offlineCtx.startRendering();
        this.clackBuffers.set(t.name, renderedBuffer);
      } catch {
        // Falha graciosa mantendo sintetizador procedural
      }
    }

    // Pré-renderização dos acordes de combinação (playMatchSuccess)
    const matchConfigs: Array<{
      name: string;
      notes: number[];
      decay: number;
      oscType: OscillatorType;
    }> = [
      { name: 'default', notes: [523.25, 659.25, 783.99, 1046.5], decay: 0.35, oscType: 'sine' },
      { name: 'zen', notes: [392.00, 523.25, 659.25, 1046.5], decay: 0.55, oscType: 'sine' },
      { name: 'water', notes: [587.33, 739.99, 880, 1174.66], decay: 0.42, oscType: 'sine' },
      { name: 'crystal', notes: [659.25, 830.61, 987.77, 1318.51], decay: 0.48, oscType: 'triangle' },
      { name: 'wood', notes: [440, 554.37, 659.25, 880], decay: 0.30, oscType: 'sine' },
      { name: 'leaf', notes: [523.25, 587.33, 659.25, 880], decay: 0.38, oscType: 'sine' },
    ];

    for (const m of matchConfigs) {
      try {
        const totalDuration = (m.notes.length - 1) * 0.05 + m.decay + 0.05;
        const length = Math.ceil(sampleRate * totalDuration);
        const offlineCtx = new OfflineCtx(1, length, sampleRate);

        m.notes.forEach((freq, idx) => {
          const startTime = idx * 0.05;
          const osc = offlineCtx.createOscillator();
          const gain = offlineCtx.createGain();

          osc.type = m.oscType;
          osc.frequency.setValueAtTime(freq, startTime);

          gain.gain.setValueAtTime(0, startTime);
          gain.gain.setValueAtTime(0.25, startTime);
          gain.gain.exponentialRampToValueAtTime(0.0001, startTime + m.decay);

          osc.connect(gain);
          gain.connect(offlineCtx.destination);

          osc.start(startTime);
          osc.stop(startTime + m.decay + 0.02);
        });

        const renderedMatchBuffer = await offlineCtx.startRendering();
        this.matchBuffers.set(m.name, renderedMatchBuffer);
      } catch {
        // Silencia em caso de limitação do device
      }
    }
  }

  /**
   * Som realista de pedra/marfim batendo suavemente (Tile Clack) com modulação de timbre
   * Utiliza buffer PCM estático pré-renderizado se disponível para latência mínima e zero alocação DSP.
   */
  public playTileClick(timbre?: TileAudioTimbre): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const key = timbre || 'zen';
    const cachedBuffer = this.clackBuffers.get(key) || this.clackBuffers.get('zen');

    if (cachedBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = cachedBuffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
        return;
      } catch {
        // Fallback procedural abaixo caso ocorra erro no buffer source
      }
    } else if (!this.isPreRenderingClacks) {
      this.preRenderClackBuffers().catch(() => {});
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';

    let centerFreq = 2200;
    let baseFreq = 1400;
    let endFreq = 350;
    let qFactor = 8;
    let duration = 0.05;

    switch (timbre) {
      case 'water':
        centerFreq = 1800;
        baseFreq = 1200;
        endFreq = 420;
        qFactor = 6;
        duration = 0.055;
        break;
      case 'wood':
        centerFreq = 1250;
        baseFreq = 950;
        endFreq = 260;
        qFactor = 10;
        duration = 0.04;
        break;
      case 'crystal':
        centerFreq = 3100;
        baseFreq = 1900;
        endFreq = 700;
        qFactor = 12;
        duration = 0.06;
        break;
      case 'leaf':
        centerFreq = 2100;
        baseFreq = 1350;
        endFreq = 320;
        qFactor = 7;
        duration = 0.045;
        break;
      case 'zen':
      default:
        centerFreq = 2200;
        baseFreq = 1400;
        endFreq = 350;
        qFactor = 8;
        duration = 0.05;
        break;
    }

    filter.frequency.setValueAtTime(centerFreq, now);
    filter.Q.setValueAtTime(qFactor, now);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration * 0.8);

    gain.gain.setValueAtTime(this.volume * 0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);

    // Ruído percussivo sutil de impacto
    this.playTransientClick(now, 0.02);
  }

  /**
   * Som de par correto eliminado (Chime harmônico suave de relaxamento) modulado por timbre
   */
  public playMatchSuccess(timbre?: TileAudioTimbre): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const key = timbre || 'default';
    const cachedBuffer = this.matchBuffers.get(key) || this.matchBuffers.get('default');

    if (cachedBuffer) {
      try {
        const source = this.ctx.createBufferSource();
        source.buffer = cachedBuffer;

        const gain = this.ctx.createGain();
        gain.gain.setValueAtTime(this.volume, this.ctx.currentTime);

        source.connect(gain);
        gain.connect(this.ctx.destination);
        source.start();
        return;
      } catch {
        // Fallback procedural abaixo caso ocorra erro
      }
    } else if (!this.isPreRenderingClacks) {
      this.preRenderClackBuffers().catch(() => {});
    }

    const now = this.ctx.currentTime;
    let notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Acorde Maior)
    let decay = 0.35;

    if (timbre === 'water') {
      notes = [587.33, 739.99, 880, 1174.66]; // D5 Maior aquático
      decay = 0.42;
    } else if (timbre === 'crystal') {
      notes = [659.25, 830.61, 987.77, 1318.51]; // E5 Cristal brilhante
      decay = 0.48;
    } else if (timbre === 'wood') {
      notes = [440, 554.37, 659.25, 880]; // A4 Quente de madeira
      decay = 0.3;
    } else if (timbre === 'leaf') {
      notes = [523.25, 587.33, 659.25, 880]; // Pentatônica suave da floresta
      decay = 0.38;
    } else if (timbre === 'zen') {
      notes = [392.00, 523.25, 659.25, 1046.5]; // Harmonia meditativa profunda
      decay = 0.55;
    }

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = timbre === 'crystal' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(this.volume * 0.25, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.05 + decay);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + decay + 0.02);
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

  /**
   * Som da língua elástica do sapo (glide elástico + pop adesivo)
   */
  public playFrogTongue(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(620, now + 0.18);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.38);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.45, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.43);

    setTimeout(() => {
      this.playTransientClick(this.ctx?.currentTime || now, 0.03);
    }, 380);
  }

  /**
   * Som de patada felina na água (patadinha fofa + splash límpido)
   */
  public playCatPaw(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.linearRampToValueAtTime(480, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.3);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.33);
  }

  /**
   * Som do eco sonar do golfinho (duplo chirp agudo cristalino)
   */
  public playDolphinSonar(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.14].forEach((delay) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200, now + delay);
      osc.frequency.exponentialRampToValueAtTime(2400, now + delay + 0.09);

      gain.gain.setValueAtTime(0, now + delay);
      gain.gain.linearRampToValueAtTime(this.volume * 0.28, now + delay + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + delay);
      osc.stop(now + delay + 0.13);
    });
  }

  /**
   * Som da garra/banquete do urso (impacto oco firme e saboroso)
   */
  public playBearClaw(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Som de enxame de abelhas (modulação de frequência em zumbido dourado)
   */
  public playBeeSwarm(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    const gain = this.ctx.createGain();

    lfo.frequency.setValueAtTime(28, now); // vibrato rápido de asas
    lfoGain.gain.setValueAtTime(35, now);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(420, now);
    osc.frequency.linearRampToValueAtTime(540, now + 0.25);

    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.22, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1100, now);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    lfo.start(now);
    osc.start(now);
    lfo.stop(now + 0.36);
    osc.stop(now + 0.36);
  }

  /**
   * Som do salto na copa do macaco (glide tonal ascendente ágil)
   */
  public playMonkeyJump(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
    osc.frequency.linearRampToValueAtTime(520, now + 0.3);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Som de recolhimento de noz pelo esquilo (estalo seco de semente + passos)
   */
  public playSquirrelAcorn(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    // Transiente crocante de noz
    this.playTransientClick(now, 0.025);

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, now + 0.02);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.14);

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(this.volume * 0.28, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now + 0.02);
    osc.stop(now + 0.2);
  }

  /**
   * Som do ouriço rolando e cravando a fruta (rolamento + impacto)
   */
  public playHedgehogRoll(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(380, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);

    setTimeout(() => {
      this.playTransientClick(this.ctx?.currentTime || now, 0.02);
    }, 140);
  }

  /**
   * Som místico do Camaleão Dourado (shimmer prismático holográfico)
   */
  public playChameleonShift(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 987.77, 1174.66, 1396.91]; // C Major 7/9
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.035);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(this.volume * 0.2, now + idx * 0.035);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.035 + 0.45);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.035);
      osc.stop(now + idx * 0.035 + 0.47);
    });
  }

  /**
   * Som de mergulho glacial do pinguim (deslize no gelo liso + splash cristalino)
   */
  public playPenguinSlide(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.linearRampToValueAtTime(1400, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.28);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.3, now + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  /**
   * Som de meditação zen do panda (gong de tigela tibetana com sustentação profunda)
   */
  public playPandaZen(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(216, now); // 216Hz harmônico zen

    gain.gain.setValueAtTime(0, now);
    gain.gain.setValueAtTime(this.volume * 0.45, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 1.22);
  }

  /**
   * Som do casco guardião da tartaruga (cúpula de proteção com ressonância aquática)
   */
  public playTurtleShield(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.linearRampToValueAtTime(180, now + 0.4);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.52);
  }

  /**
   * Som do salto veloz do coelho (duplo boing elástico suave)
   */
  public playRabbitHop(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now + offset);
      osc.frequency.exponentialRampToValueAtTime(750, now + offset + 0.08);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.setValueAtTime(this.volume * 0.28, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.11);
    });
  }

  /**
   * Som do rastro astuto da raposa (farfalhar veloz com estalo de brasa)
   */
  public playFoxTrail(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.linearRampToValueAtTime(1100, now + 0.1);
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  /**
   * Som da amizade entre cão e gato (harmonia lúdica de companheirismo)
   */
  public playDogCatHarmony(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(260, now);
    osc1.frequency.linearRampToValueAtTime(390, now + 0.18);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(520, now + 0.05);
    osc2.frequency.linearRampToValueAtTime(650, now + 0.22);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.32, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);

    osc1.start(now);
    osc2.start(now + 0.05);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  /**
   * Som de bater de asas da borboleta com dança do pólen (flauta pentatônica suave)
   */
  public playButterflyFlap(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [659.25, 783.99, 987.77]; // E5, G5, B5
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.06);

      gain.gain.setValueAtTime(0, now + idx * 0.06);
      gain.gain.linearRampToValueAtTime(this.volume * 0.22, now + idx * 0.06 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.06 + 0.28);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + 0.3);
    });
  }

  /**
   * Som da tromba poderosa do elefante (impacto sísmico que esfarela rochas)
   */
  public playElephantCrush(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.25);

    gain.gain.setValueAtTime(this.volume * 0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);

    setTimeout(() => {
      this.playTransientClick(this.ctx?.currentTime || now, 0.04);
    }, 40);
  }

  /**
   * Som de passeio na lagoa do pato (ondulações com quack acolhedor)
   */
  public playDuckSplash(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.linearRampToValueAtTime(220, now + 0.15);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(this.volume * 0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Som do rugido soberano do leão (sub-bass solar iluminado)
   */
  public playLionRoar(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.linearRampToValueAtTime(170, now + 0.15);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.38);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.55, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.42);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.43);
  }

  /**
   * Som do voo colhedor do pássaro (trinados matinais velozes)
   */
  public playBirdSwoop(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [0, 0.08, 0.16].forEach((offset, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const base = 1600 + idx * 250;
      osc.frequency.setValueAtTime(base, now + offset);
      osc.frequency.exponentialRampToValueAtTime(base + 500, now + offset + 0.05);

      gain.gain.setValueAtTime(0, now + offset);
      gain.gain.setValueAtTime(this.volume * 0.22, now + offset + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.07);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });
  }

  /**
   * Som do passo zen da lesma (gotas de orvalho pingando suavemente em folhas)
   */
  public playSnailZen(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1480, now);
    osc.frequency.exponentialRampToValueAtTime(2200, now + 0.03);

    gain.gain.setValueAtTime(this.volume * 0.22, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.36);
  }

  /**
   * Som de gelo trincando (crack cristalino seco)
   */
  public playIceCrack(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Chirp agudo cristalino
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2800, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);

    // 2. Ruído de estalido de gelo
    this.playTransientClick(now, 0.025);
  }

  /**
   * Som de cipó cortado (corte vegetal limpo e seco)
   */
  public playVineCut(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1600, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(480, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  }

  /**
   * Som de vinhas farfalhando quando o jogador toca numa peça enredada
   */
  public playVineRustle(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, now);
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.12);

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

    gain.gain.setValueAtTime(this.volume * 0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.12);
  }

  /**
   * Som de predação na bandeja (mordida selvagem com impacto ágil)
   */
  public playPredationStrike(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(350, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.15);

    gain.gain.setValueAtTime(this.volume * 0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  /**
   * Som de casulo eclodindo (eclosão mágica com arpejo luminoso)
   */
  public playCocoonHatch(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const notes = [659.25, 880, 1174.66, 1760]; // E5, A5, D6, A6

    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.setValueAtTime(this.volume * 0.28, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.04 + 0.32);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.34);
    });
  }

  /**
   * Som de reflexo do espelho (shimmer cintilante harmônico)
   */
  public playMirrorReflect(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const frequencies = [1318.51, 1975.53, 2637.02]; // E6, B6, E7

    frequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.03);
      osc.frequency.linearRampToValueAtTime(freq + 40, now + idx * 0.03 + 0.2);

      gain.gain.setValueAtTime(this.volume * 0.2, now + idx * 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.03 + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.03);
      osc.stop(now + idx * 0.03 + 0.26);
    });
  }

  /**
   * Toca o som procedural específico para o tipo de sinergia acionado
   */
  public playSynergySound(synergyType: string): void {
    switch (synergyType) {
      case 'frog_tongue': this.playFrogTongue(); break;
      case 'cat_paw': this.playCatPaw(); break;
      case 'bear_feast': this.playBearClaw(); break;
      case 'dolphin_sonar': this.playDolphinSonar(); break;
      case 'bee_honey': this.playBeeSwarm(); break;
      case 'monkey_banana': this.playMonkeyJump(); break;
      case 'squirrel_acorn': this.playSquirrelAcorn(); break;
      case 'hedgehog_apple': this.playHedgehogRoll(); break;
      case 'wildcard_chameleon': this.playChameleonShift(); break;
      case 'penguin_slide': this.playPenguinSlide(); break;
      case 'panda_zen': this.playPandaZen(); break;
      case 'turtle_shield': this.playTurtleShield(); break;
      case 'rabbit_hop': this.playRabbitHop(); break;
      case 'fox_trail': this.playFoxTrail(); break;
      case 'dog_cat_harmony': this.playDogCatHarmony(); break;
      case 'butterfly_flap': this.playButterflyFlap(); break;
      case 'elephant_crush': this.playElephantCrush(); break;
      case 'duck_splash': this.playDuckSplash(); break;
      case 'lion_roar': this.playLionRoar(); break;
      case 'bird_swoop': this.playBirdSwoop(); break;
      case 'snail_zen': this.playSnailZen(); break;
      case 'floral_harmony': this.playMirrorReflect(); break;
      case 'marine_abyss': this.playDolphinSonar(); break;
      case 'mythic_harmony': this.playPandaZen(); break;
      case 'nature_harmony': this.playSynergyBonus(); break;
      default:
        this.playSynergyBonus();
        break;
    }
  }



  /**
   * Som de estilhaçamento de Selo Elemental (cúpula rúnica se rompendo)
   */
  public playSealBreak(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Acorde Maior de Cristal)
    freqs.forEach((f, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, now + idx * 0.04);
      osc.frequency.exponentialRampToValueAtTime(f * 1.5, now + idx * 0.04 + 0.25);

      gain.gain.setValueAtTime(0, now + idx * 0.04);
      gain.gain.linearRampToValueAtTime(this.volume * 0.35, now + idx * 0.04 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.32);
    });
  }

  /**
   * Som de névoa se dissipando (sopro etéreo zen)
   */
  public playMistDissipate(): void {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1760, now + 0.22);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(this.volume * 0.2, now + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
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

  public getDiagnostics(): Record<string, any> {
    return {
      state: this.ctx ? this.ctx.state : 'uninitialized',
      sampleRate: this.ctx ? this.ctx.sampleRate : null,
      baseLatencyMs: this.ctx && 'baseLatency' in this.ctx ? Number(((this.ctx as any).baseLatency * 1000).toFixed(2)) : null,
      outputLatencyMs: this.ctx && 'outputLatency' in this.ctx ? Number(((this.ctx as any).outputLatency * 1000).toFixed(2)) : null,
      isMuted: this.isMuted,
      musicEnabled: this.musicEnabled,
      clackBuffersCount: this.clackBuffers.size,
      matchBuffersCount: this.matchBuffers.size,
    };
  }
}

export const soundManager = new SoundManager();
