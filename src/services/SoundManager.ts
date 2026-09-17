import { useSettingsStore } from '../stores/settingsStore'

interface SoundDiagnostics {
  ticks: number
  snaps: number
  reveals: number
  lastVelocity: number
}

class SoundManager {
  private context: AudioContext | null = null
  private noiseBuffer: AudioBuffer | null = null
  private output: DynamicsCompressorNode | null = null
  private diagnostics: SoundDiagnostics = { ticks: 0, snaps: 0, reveals: 0, lastVelocity: 0 }

  async unlock() {
    if (typeof window === 'undefined') return
    if (!this.context) this.context = new AudioContext()
    if (this.context.state === 'suspended') await this.context.resume()
  }

  setMuted(muted: boolean) {
    useSettingsStore.getState().setSoundMuted(muted)
  }

  setVolume(volume: number) {
    useSettingsStore.getState().setSoundVolume(Math.max(0, Math.min(1, volume)))
  }

  private canPlay() {
    const settings = useSettingsStore.getState()
    return this.context && this.context.state === 'running' && !settings.soundMuted && settings.soundVolume > 0
  }

  private getOutput() {
    if (!this.context) return null
    if (this.output) return this.output
    const compressor = this.context.createDynamicsCompressor()
    compressor.threshold.value = -17
    compressor.knee.value = 16
    compressor.ratio.value = 5
    compressor.attack.value = 0.002
    compressor.release.value = 0.09
    compressor.connect(this.context.destination)
    this.output = compressor
    return compressor
  }

  private getNoiseBuffer() {
    if (!this.context) return null
    if (this.noiseBuffer) return this.noiseBuffer
    const length = Math.floor(this.context.sampleRate * 0.08)
    const buffer = this.context.createBuffer(1, length, this.context.sampleRate)
    const channel = buffer.getChannelData(0)
    for (let index = 0; index < length; index += 1) channel[index] = Math.random() * 2 - 1
    this.noiseBuffer = buffer
    return buffer
  }

  playTick(velocity: number) {
    this.diagnostics.ticks += 1
    this.diagnostics.lastVelocity = velocity
    window.dispatchEvent(new CustomEvent('knowledge-orbit:tick', { detail: { velocity, tick: this.diagnostics.ticks } }))
    if (!this.canPlay() || !this.context) return
    const now = this.context.currentTime
    const volume = useSettingsStore.getState().soundVolume
    const normalized = Math.min(1, velocity / 18)
    const response = Math.pow(normalized, 0.58)
    const pitchDrift = (Math.random() - 0.5) * 28
    const output = this.getOutput()
    if (!output) return

    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(470 + response * 520 + pitchDrift, now)
    oscillator.frequency.exponentialRampToValueAtTime(270 + response * 310, now + 0.026)
    gain.gain.setValueAtTime((0.032 + response * 0.044) * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.038)
    oscillator.connect(gain).connect(output)
    oscillator.start(now)
    oscillator.stop(now + 0.042)

    // A short low mechanical knock gives each crossed card physical weight.
    const body = this.context.createOscillator()
    const bodyGain = this.context.createGain()
    body.type = 'sine'
    body.frequency.setValueAtTime(128 + response * 105, now)
    body.frequency.exponentialRampToValueAtTime(82 + response * 55, now + 0.046)
    bodyGain.gain.setValueAtTime((0.024 + response * 0.036) * volume, now)
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.052)
    body.connect(bodyGain).connect(output)
    body.start(now)
    body.stop(now + 0.058)

    const buffer = this.getNoiseBuffer()
    if (!buffer) return
    const noise = this.context.createBufferSource()
    const filter = this.context.createBiquadFilter()
    const noiseGain = this.context.createGain()
    noise.buffer = buffer
    filter.type = 'bandpass'
    filter.frequency.value = 1500 + response * 1450
    filter.Q.value = 3.2
    noiseGain.gain.setValueAtTime((0.014 + response * 0.016) * volume, now)
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.017)
    noise.connect(filter).connect(noiseGain).connect(output)
    noise.start(now)
    noise.stop(now + 0.021)
  }

  playSnap() {
    this.diagnostics.snaps += 1
    window.dispatchEvent(new CustomEvent('knowledge-orbit:snap', { detail: { snap: this.diagnostics.snaps } }))
    if (!this.canPlay() || !this.context) return
    const now = this.context.currentTime
    const volume = useSettingsStore.getState().soundVolume
    const output = this.getOutput()
    if (!output) return
    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(118, now)
    oscillator.frequency.exponentialRampToValueAtTime(58, now + 0.19)
    gain.gain.setValueAtTime(0.085 * volume, now)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24)
    oscillator.connect(gain).connect(output)
    oscillator.start(now)
    oscillator.stop(now + 0.25)
  }

  playReveal() {
    this.diagnostics.reveals += 1
    if (!this.canPlay() || !this.context) return
    const now = this.context.currentTime
    const volume = useSettingsStore.getState().soundVolume
    const output = this.getOutput()
    if (!output) return
    ;[330, 495].forEach((frequency, index) => {
      const oscillator = this.context!.createOscillator()
      const gain = this.context!.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.035)
      gain.gain.exponentialRampToValueAtTime(0.024 * volume, now + 0.055 + index * 0.035)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32 + index * 0.035)
      oscillator.connect(gain).connect(output)
      oscillator.start(now + index * 0.035)
      oscillator.stop(now + 0.36 + index * 0.035)
    })
  }

  getDiagnostics() {
    return { ...this.diagnostics }
  }

  resetDiagnostics() {
    this.diagnostics = { ticks: 0, snaps: 0, reveals: 0, lastVelocity: 0 }
  }
}

export const soundManager = new SoundManager()
