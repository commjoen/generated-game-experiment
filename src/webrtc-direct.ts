/**
 * WebRTC Direct P2P — Serverless multiplayer for GitHub Pages and static hosting.
 *
 * Players exchange "room codes" (base64-encoded SDP with gathered ICE candidates)
 * manually via any out-of-band channel (chat, URL, copy-paste). No server is
 * required for signaling; only public STUN servers are used for NAT traversal.
 *
 * Connection flow:
 *   Player A: createOffer() → share offerCode with Player B
 *   Player B: acceptOffer(offerCode) → share answerCode with Player A
 *   Player A: acceptAnswer(answerCode) → P2P DataChannel established
 */

export type WebRTCDirectState =
  | 'idle'
  | 'gathering'
  | 'waiting-for-answer'
  | 'waiting-for-connection'
  | 'connected'
  | 'failed';

export interface WebRTCDirectCallbacks {
  onMessage: (data: unknown) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError?: (error: Error) => void;
}

const ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

/** Timeout (ms) to wait for ICE gathering to complete before giving up. */
const ICE_GATHERING_TIMEOUT_MS = 10_000;

export class WebRTCDirect {
  private pc: RTCPeerConnection | null = null;
  private dc: RTCDataChannel | null = null;
  private _state: WebRTCDirectState = 'idle';
  private readonly callbacks: WebRTCDirectCallbacks;

  constructor(callbacks: WebRTCDirectCallbacks) {
    this.callbacks = callbacks;
  }

  /** Returns true when the browser supports WebRTC. */
  static isSupported(): boolean {
    return typeof RTCPeerConnection !== 'undefined';
  }

  get state(): WebRTCDirectState {
    return this._state;
  }

  get isConnected(): boolean {
    return this._state === 'connected';
  }

  /**
   * Step 1 (initiator): Create an offer room code.
   *
   * Waits for ICE gathering to complete so the returned code is fully
   * self-contained — no trickle-ICE round-trips are needed.
   *
   * @returns Base64-encoded offer SDP to share with the other player.
   */
  async createOffer(): Promise<string> {
    this.cleanup();
    this._state = 'gathering';

    const pc = this.createPeerConnection();
    this.dc = pc.createDataChannel('game', { ordered: true });
    this.setupDataChannel(this.dc);

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const sdp = await this.waitForICEGathering(pc);
    this._state = 'waiting-for-answer';
    return this.encode(sdp);
  }

  /**
   * Step 2 (responder): Accept the offer code and produce an answer code.
   *
   * @param offerCode  The base64 offer code from the initiating player.
   * @returns Base64-encoded answer SDP to share back with the initiator.
   */
  async acceptOffer(offerCode: string): Promise<string> {
    this.cleanup();
    this._state = 'gathering';

    const offerSDP = this.decode(offerCode);

    const pc = this.createPeerConnection();
    pc.ondatachannel = (event) => {
      this.dc = event.channel;
      this.setupDataChannel(this.dc);
    };

    await pc.setRemoteDescription(new RTCSessionDescription(offerSDP));
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    const sdp = await this.waitForICEGathering(pc);
    this._state = 'waiting-for-connection';
    return this.encode(sdp);
  }

  /**
   * Step 3 (initiator): Complete the handshake with the answer code.
   *
   * @param answerCode  The base64 answer code from the responding player.
   */
  async acceptAnswer(answerCode: string): Promise<void> {
    if (!this.pc) throw new Error('Call createOffer() before acceptAnswer()');
    const answerSDP = this.decode(answerCode);
    await this.pc.setRemoteDescription(new RTCSessionDescription(answerSDP));
    this._state = 'waiting-for-connection';
  }

  /** Send a JSON-serialisable message over the DataChannel. */
  send(data: unknown): void {
    if (this.dc && this.dc.readyState === 'open') {
      try {
        this.dc.send(JSON.stringify(data));
      } catch {
        // DataChannel may have closed unexpectedly; ignore
      }
    }
  }

  /** Close and clean up the peer connection and data channel. */
  cleanup(): void {
    if (this.dc) {
      this.dc.close();
      this.dc = null;
    }
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
    this._state = 'idle';
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    this.pc = pc;

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        if (this._state === 'connected') {
          this._state = 'idle';
          this.callbacks.onDisconnected();
        } else {
          this._state = 'failed';
          this.callbacks.onError?.(new Error('WebRTC connection failed'));
        }
      }
    };

    return pc;
  }

  private setupDataChannel(dc: RTCDataChannel): void {
    dc.onopen = () => {
      this._state = 'connected';
      this.callbacks.onConnected();
    };

    dc.onclose = () => {
      if (this._state === 'connected') {
        this._state = 'idle';
        this.callbacks.onDisconnected();
      }
    };

    dc.onerror = () => {
      this.callbacks.onError?.(new Error('DataChannel error'));
    };

    dc.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data as string) as unknown;
        this.callbacks.onMessage(data);
      } catch {
        // Ignore malformed messages
      }
    };
  }

  /**
   * Waits until ICE gathering is complete (iceGatheringState === 'complete')
   * or until the timeout fires, then returns the local description.
   *
   * Using a timeout fallback means the code still works when STUN is
   * unreachable — we ship whatever candidates have been gathered so far.
   */
  private waitForICEGathering(
    pc: RTCPeerConnection
  ): Promise<RTCSessionDescriptionInit> {
    return new Promise<RTCSessionDescriptionInit>((resolve, reject) => {
      const finish = () => {
        const desc = pc.localDescription;
        if (desc) {
          resolve({ type: desc.type, sdp: desc.sdp });
        } else {
          reject(
            new Error('No local description available after ICE gathering')
          );
        }
      };

      if (pc.iceGatheringState === 'complete') {
        finish();
        return;
      }

      const timeout = setTimeout(() => {
        // Use whatever candidates have been gathered so far
        finish();
      }, ICE_GATHERING_TIMEOUT_MS);

      pc.onicegatheringstatechange = () => {
        if (pc.iceGatheringState === 'complete') {
          clearTimeout(timeout);
          finish();
        }
      };
    });
  }

  private encode(sdp: RTCSessionDescriptionInit): string {
    return btoa(JSON.stringify(sdp));
  }

  private decode(code: string): RTCSessionDescriptionInit {
    try {
      return JSON.parse(atob(code)) as RTCSessionDescriptionInit;
    } catch {
      throw new Error(
        'Invalid room code — please check you copied it in full and try again'
      );
    }
  }
}
