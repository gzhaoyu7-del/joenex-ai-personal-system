import type { GestureAction, GestureStatus } from '../../types'

interface Landmark {
  x: number
  y: number
  z?: number
}

type Pose = 'open-palm' | 'closed-fist' | 'pinch' | null

const distance = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y)

export class GestureStateMachine {
  private pose: Pose = null
  private poseSince = 0
  private triggeredPose: Pose = null
  private lastTriggerAt = -Infinity
  private lastWrist: { x: number; time: number } | null = null
  private smoothedVelocity = 0
  readonly confidenceThreshold = 0.68
  readonly cooldownMs = 950

  reset() {
    this.pose = null
    this.poseSince = 0
    this.triggeredPose = null
    this.lastTriggerAt = -Infinity
    this.lastWrist = null
    this.smoothedVelocity = 0
  }

  update(landmarks: Landmark[], confidence: number, now: number): GestureAction | null {
    if (confidence < this.confidenceThreshold || landmarks.length < 21) {
      this.pose = null
      this.triggeredPose = null
      return null
    }

    const extended = [[8, 6], [12, 10], [16, 14], [20, 18]]
      .filter(([tip, pip]) => landmarks[tip].y < landmarks[pip].y - 0.025).length
    const folded = [[8, 6], [12, 10], [16, 14], [20, 18]]
      .filter(([tip, pip]) => landmarks[tip].y > landmarks[pip].y + 0.018).length
    const isPinch = distance(landmarks[4], landmarks[8]) < 0.052
    // A closed hand often also brings thumb and index close together. Prioritize
    // the fist so the user's explicit "close to lock" action cannot become pinch.
    const nextPose: Pose = extended >= 4 ? 'open-palm' : folded >= 3 ? 'closed-fist' : isPinch ? 'pinch' : null

    if (nextPose !== this.pose) {
      this.pose = nextPose
      this.poseSince = now
      this.triggeredPose = null
    }

    const holds: Record<Exclude<Pose, null>, number> = { 'open-palm': 420, 'closed-fist': 310, pinch: 330 }
    if (nextPose && this.triggeredPose !== nextPose && now - this.poseSince >= holds[nextPose] && now - this.lastTriggerAt >= this.cooldownMs) {
      this.triggeredPose = nextPose
      this.lastTriggerAt = now
      if (nextPose === 'open-palm') return 'draw'
      if (nextPose === 'closed-fist') return 'lock'
      return 'select'
    }

    const wrist = landmarks[0]
    if (this.lastWrist) {
      const elapsed = Math.max((now - this.lastWrist.time) / 1000, 0.016)
      const velocity = (wrist.x - this.lastWrist.x) / elapsed
      this.smoothedVelocity = this.smoothedVelocity * 0.72 + velocity * 0.28
      if (!nextPose && Math.abs(this.smoothedVelocity) > 0.62 && now - this.lastTriggerAt >= this.cooldownMs) {
        this.lastTriggerAt = now
        const action = this.smoothedVelocity > 0 ? 'swipe-left' : 'swipe-right'
        this.smoothedVelocity = 0
        this.lastWrist = { x: wrist.x, time: now }
        return action
      }
    }
    this.lastWrist = { x: wrist.x, time: now }
    return null
  }
}

type StatusCallback = (status: GestureStatus, message: string) => void

class GestureManager {
  private active = false
  private stream: MediaStream | null = null
  private frameId: number | null = null
  private landmarker: { detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks: Landmark[][]; handedness: { score?: number }[][] }; close: () => void } | null = null
  private machine = new GestureStateMachine()
  private statusHoldUntil = 0

  async enable(video: HTMLVideoElement, onAction: (action: GestureAction) => void, onStatus: StatusCallback) {
    if (this.active) return
    this.active = true
    onStatus('loading', 'LOADING HAND MODEL')
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      })
      video.srcObject = this.stream
      video.muted = true
      video.playsInline = true
      await video.play()

      const { FilesetResolver, HandLandmarker } = await import('@mediapipe/tasks-vision')
      if (!this.active) return
      const vision = await FilesetResolver.forVisionTasks('/mediapipe/wasm')
      this.landmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: '/mediapipe/models/hand_landmarker.task',
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.68,
        minHandPresenceConfidence: 0.68,
        minTrackingConfidence: 0.62,
      }) as typeof this.landmarker
      onStatus('searching', 'SHOW YOUR HAND')

      let lastVideoTime = -1
      const loop = () => {
        if (!this.active || !this.landmarker) return
        if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          const result = this.landmarker.detectForVideo(video, performance.now())
          lastVideoTime = video.currentTime
          const landmarks = result.landmarks[0]
          if (landmarks) {
            const confidence = result.handedness[0]?.[0]?.score ?? 0.8
            const now = performance.now()
            if (now >= this.statusHoldUntil) onStatus('detected', 'HAND DETECTED')
            const action = this.machine.update(landmarks, confidence, now)
            if (action) {
              this.statusHoldUntil = now + 900
              if (action === 'draw') onStatus('detected', 'OPEN PALM · SPINNING')
              if (action === 'lock') onStatus('detected', 'FIST CLOSED · TARGET LOCKED')
              onAction(action)
            }
          } else {
            onStatus('searching', 'SHOW YOUR HAND')
          }
        }
        this.frameId = requestAnimationFrame(loop)
      }
      this.frameId = requestAnimationFrame(loop)
    } catch (error) {
      this.disable(video)
      const message = error instanceof Error ? error.message : 'Camera unavailable'
      onStatus('error', message.toUpperCase().slice(0, 42))
      throw error
    }
  }

  disable(video?: HTMLVideoElement) {
    this.active = false
    if (this.frameId !== null) cancelAnimationFrame(this.frameId)
    this.frameId = null
    this.landmarker?.close()
    this.landmarker = null
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    if (video) {
      video.pause()
      video.srcObject = null
    }
    this.machine.reset()
    this.statusHoldUntil = 0
  }

  isStreamStopped() {
    return !this.stream || this.stream.getTracks().every((track) => track.readyState === 'ended')
  }
}

export const gestureManager = new GestureManager()
