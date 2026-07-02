// src/audio/audioEngine.ts
// Core Web Audio API engine — manages AudioContext, AnalyserNode, and data extraction

import { AudioData } from '../types/audio';
import {
  computeBandEnergy,
  computeVolume,
  detectStrum,
  smoothValue,
} from './audioUtils';

/** Configuration for the AudioEngine */
interface AudioEngineConfig {
  /** FFT size — higher = more frequency resolution, lower = more responsive */
  fftSize?: number;
  /** Smoothing time constant for the AnalyserNode (0–1) */
  smoothingTimeConstant?: number;
}

/**
 * AudioEngine wraps the Web Audio API to provide normalized audio analysis data.
 * Supports both microphone input and AudioBufferSourceNode (file playback).
 *
 * Usage:
 *   const engine = new AudioEngine();
 *   await engine.startMicrophone();
 *   const data = engine.getAudioData();
 *   engine.stop();
 */
export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private sourceNode: AudioNode | null = null;
  private mediaStream: MediaStream | null = null;

  // Reusable typed arrays — allocated once to avoid GC pressure
  private frequencyData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));
  private waveformData: Uint8Array<ArrayBuffer> = new Uint8Array(new ArrayBuffer(0));

  // Smoothed values persist across frames to provide fluid animation
  private smoothedVolume = 0;
  private smoothedBass = 0;
  private smoothedMid = 0;
  private smoothedHigh = 0;
  private smoothedStrum = 0;
  private prevVolume = 0;

  private readonly fftSize: number;
  private readonly smoothingTimeConstant: number;

  constructor(config: AudioEngineConfig = {}) {
    this.fftSize = config.fftSize ?? 2048;
    this.smoothingTimeConstant = config.smoothingTimeConstant ?? 0.8;
  }

  /** Initialize the AudioContext and AnalyserNode */
  private initContext(): void {
    if (this.audioContext) return;

    this.audioContext = new AudioContext();
    this.analyserNode = this.audioContext.createAnalyser();
    this.analyserNode.fftSize = this.fftSize;
    // Built-in smoothing from the Web Audio API
    this.analyserNode.smoothingTimeConstant = this.smoothingTimeConstant;
    // NOTE: do NOT connect analyserNode to destination here.
    // The analyser is a tap/observer node. For mic input, we connect:
    //   source → analyserNode  (no destination — avoids speaker feedback)
    // For file playback, we connect:
    //   source → analyserNode → destination  (so we hear the audio)

    // Pre-allocate buffers
    const bufferLength = this.analyserNode.frequencyBinCount;
    this.frequencyData = new Uint8Array(new ArrayBuffer(bufferLength));
    this.waveformData = new Uint8Array(new ArrayBuffer(this.fftSize));
  }

  /**
   * Start capturing audio from the user's microphone.
   * Requests getUserMedia and connects the stream to the analyser.
   */
  async startMicrophone(): Promise<void> {
    this.stop(); // Clean up any previous source
    this.initContext();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false, // Keep raw audio for better musical analysis
        noiseSuppression: false,
        autoGainControl: false,
      },
    });

    this.mediaStream = stream;

    const source = this.audioContext!.createMediaStreamSource(stream);
    // Connect: mic → analyser (do NOT connect to destination to avoid feedback)
    source.connect(this.analyserNode!);
    this.sourceNode = source;

    // Resume context if it was suspended (browser autoplay policy)
    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }
  }

  /**
   * Start analyzing an audio file (ArrayBuffer decoded to AudioBuffer).
   * Used for the "upload audio file" feature.
   */
  async startAudioBuffer(buffer: ArrayBuffer): Promise<void> {
    this.stop();
    this.initContext();

    const audioBuffer = await this.audioContext!.decodeAudioData(buffer);
    const source = this.audioContext!.createBufferSource();
    source.buffer = audioBuffer;
    source.loop = true;
    source.connect(this.analyserNode!);
    source.connect(this.audioContext!.destination);
    source.start();
    this.sourceNode = source;

    if (this.audioContext!.state === 'suspended') {
      await this.audioContext!.resume();
    }
  }

  /**
   * Read the latest audio analysis data and return a normalized AudioData snapshot.
   * This should be called every animation frame.
   *
   * @param sensitivity - User sensitivity multiplier (applied to all energies)
   */
  getAudioData(sensitivity: number = 1): AudioData {
    if (!this.analyserNode) {
      return this.emptyAudioData();
    }

    // Pull latest data from the Web Audio API
    this.analyserNode.getByteFrequencyData(this.frequencyData);
    this.analyserNode.getByteTimeDomainData(this.waveformData);

    const sampleRate = this.audioContext?.sampleRate ?? 44100;

    // Compute raw band energies from FFT bins
    const rawVolume = computeVolume(this.waveformData) * sensitivity;
    const rawBass = computeBandEnergy(this.frequencyData, sampleRate, this.fftSize, 20, 300) * sensitivity;
    const rawMid = computeBandEnergy(this.frequencyData, sampleRate, this.fftSize, 300, 3000) * sensitivity;
    const rawHigh = computeBandEnergy(this.frequencyData, sampleRate, this.fftSize, 3000, 20000) * sensitivity;

    // Clamp to 0–1
    const vol = Math.min(1, rawVolume);
    const bass = Math.min(1, rawBass);
    const mid = Math.min(1, rawMid);
    const high = Math.min(1, rawHigh);

    // Detect strum transient (sudden volume spike)
    const rawStrum = detectStrum(this.prevVolume, vol);
    this.prevVolume = vol;

    // Apply exponential smoothing — different factors for different data:
    // Volume and strum need fast response; bass can be slower and smoother
    this.smoothedVolume = smoothValue(this.smoothedVolume, vol, 0.15);
    this.smoothedBass = smoothValue(this.smoothedBass, bass, 0.12);
    this.smoothedMid = smoothValue(this.smoothedMid, mid, 0.14);
    this.smoothedHigh = smoothValue(this.smoothedHigh, high, 0.18);
    // Strum decays quickly so visuals snap on attack but fade gracefully
    this.smoothedStrum = Math.max(this.smoothedStrum * 0.88, rawStrum);

    return {
      volume: this.smoothedVolume,
      bassEnergy: this.smoothedBass,
      midEnergy: this.smoothedMid,
      highEnergy: this.smoothedHigh,
      strumIntensity: this.smoothedStrum,
      frequencyData: this.frequencyData,
      waveformData: this.waveformData,
    };
  }

  /** Stop all audio sources and clean up resources */
  stop(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
        if (this.sourceNode instanceof AudioBufferSourceNode) {
          this.sourceNode.stop();
        }
      } catch {
        // Already stopped — ignore
      }
      this.sourceNode = null;
    }

    // Reset smoothed values
    this.smoothedVolume = 0;
    this.smoothedBass = 0;
    this.smoothedMid = 0;
    this.smoothedHigh = 0;
    this.smoothedStrum = 0;
    this.prevVolume = 0;
  }

  /** Fully destroy the engine (closes AudioContext) */
  destroy(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.analyserNode = null;
    }
  }

  get isRunning(): boolean {
    return this.audioContext?.state === 'running' && this.sourceNode !== null;
  }

  private emptyAudioData(): AudioData {
    return {
      volume: 0,
      bassEnergy: 0,
      midEnergy: 0,
      highEnergy: 0,
      strumIntensity: 0,
      frequencyData: new Uint8Array(new ArrayBuffer(0)),
      waveformData: new Uint8Array(new ArrayBuffer(0)),
    };
  }
}
