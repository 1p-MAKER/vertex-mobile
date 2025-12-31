'use client';

class AudioManager {
    private context: AudioContext | null = null;
    private buffers: Map<string, AudioBuffer> = new Map();

    constructor() {
        if (typeof window !== 'undefined') {
            this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    async loadSound(name: string, url: string) {
        if (!this.context) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            this.buffers.set(name, audioBuffer);
        } catch (e) {
            console.error(`Failed to load sound: ${name}`, e);
        }
    }

    playSound(name: string, volume: number = 1.0, pitch: number = 1.0) {
        if (!this.context) return;

        if (this.context.state === 'suspended') {
            this.context.resume();
        }

        if (this.buffers.has(name)) {
            const source = this.context.createBufferSource();
            source.buffer = this.buffers.get(name)!;
            source.playbackRate.value = pitch;
            const gainNode = this.context.createGain();
            gainNode.gain.value = volume;
            source.connect(gainNode);
            gainNode.connect(this.context.destination);
            source.start(0);
        } else if (name === 'pop') {
            this.playSynthPop(volume, pitch);
        }
    }

    playSynthPop(volume: number = 0.2, pitch: number = 1.0) {
        if (!this.context) return;
        if (this.context.state === 'suspended') this.context.resume();

        const osc = this.context.createOscillator();
        const gain = this.context.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400 * pitch, this.context.currentTime);
        osc.frequency.exponentialRampToValueAtTime(10, this.context.currentTime + 0.1);

        gain.gain.setValueAtTime(volume, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.1);

        osc.connect(gain);
        gain.connect(this.context.destination);

        osc.start();
        osc.stop(this.context.currentTime + 0.1);
    }

    playSynthExplosion() {
        if (!this.context) return;
        if (this.context.state === 'suspended') this.context.resume();

        const duration = 1.5;
        const noise = this.context.createBufferSource();
        const noiseBuffer = this.context.createBuffer(1, this.context.sampleRate * duration, this.context.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < this.context.sampleRate * duration; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        noise.buffer = noiseBuffer;

        const noiseFilter = this.context.createBiquadFilter();
        noiseFilter.type = 'lowpass';
        noiseFilter.frequency.setValueAtTime(1000, this.context.currentTime);
        noiseFilter.frequency.exponentialRampToValueAtTime(10, this.context.currentTime + duration);

        const noiseGain = this.context.createGain();
        noiseGain.gain.setValueAtTime(0.5, this.context.currentTime);
        noiseGain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.context.destination);

        noise.start();
        noise.stop(this.context.currentTime + duration);
    }
}

export const audioManager = typeof window !== 'undefined' ? new AudioManager() : null;
