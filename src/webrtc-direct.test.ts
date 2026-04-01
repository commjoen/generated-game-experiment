/**
 * Unit tests for the WebRTCDirect module.
 *
 * WebRTCDirect operates entirely in the browser; RTCPeerConnection is not
 * available in the Node.js / vitest-node environment. These tests therefore
 * validate the helper logic (encode/decode, state machine, guard clauses) by
 * mocking the browser API rather than running real ICE negotiations.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebRTCDirect } from './webrtc-direct.js';

// ── Minimal RTCPeerConnection mock ────────────────────────────────────────────

class MockDataChannel extends EventTarget {
  readyState: RTCDataChannelState = 'connecting';
  onopen: ((e: Event) => void) | null = null;
  onclose: ((e: Event) => void) | null = null;
  onerror: ((e: Event) => void) | null = null;
  onmessage: ((e: MessageEvent) => void) | null = null;

  close() {
    this.readyState = 'closed';
  }
  send(_data: string) {
    /* no-op in tests */
  }

  simulateOpen() {
    this.readyState = 'open';
    this.onopen?.(new Event('open'));
  }
  simulateClose() {
    this.readyState = 'closed';
    this.onclose?.(new Event('close'));
  }
  simulateMessage(data: unknown) {
    this.onmessage?.(
      new MessageEvent('message', { data: JSON.stringify(data) })
    );
  }
}

class MockPeerConnection {
  iceGatheringState: RTCIceGatheringState = 'new';
  connectionState: RTCPeerConnectionState = 'new';
  localDescription: RTCSessionDescriptionInit | null = null;
  onicegatheringstatechange: (() => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  ondatachannel: ((e: RTCDataChannelEvent) => void) | null = null;

  private _dc: MockDataChannel | null = null;

  createDataChannel(
    _label: string,
    _opts?: RTCDataChannelInit
  ): MockDataChannel {
    this._dc = new MockDataChannel();
    return this._dc;
  }

  async createOffer(): Promise<RTCSessionDescriptionInit> {
    return { type: 'offer', sdp: 'fake-offer-sdp' };
  }

  async createAnswer(): Promise<RTCSessionDescriptionInit> {
    return { type: 'answer', sdp: 'fake-answer-sdp' };
  }

  async setLocalDescription(desc: RTCSessionDescriptionInit) {
    this.localDescription = desc;
  }

  async setRemoteDescription(_desc: RTCSessionDescriptionInit) {
    /* no-op */
  }

  close() {
    this.connectionState = 'closed';
  }

  /** Helper to simulate ICE gathering completion. */
  simulateIceComplete(sdp?: string) {
    if (this.localDescription) {
      if (sdp) this.localDescription = { ...this.localDescription, sdp };
    }
    this.iceGatheringState = 'complete';
    this.onicegatheringstatechange?.();
  }

  /** Simulate the remote peer opening the DataChannel. */
  simulateRemoteDataChannel() {
    const dc = new MockDataChannel();
    this._dc = dc;
    this.ondatachannel?.({ channel: dc } as unknown as RTCDataChannelEvent);
    return dc;
  }

  getDataChannel() {
    return this._dc;
  }
}

// ── Test setup ────────────────────────────────────────────────────────────────

let mockPc: MockPeerConnection;

function makeCallbacks() {
  return {
    onMessage: vi.fn(),
    onConnected: vi.fn(),
    onDisconnected: vi.fn(),
    onError: vi.fn(),
  };
}

beforeEach(() => {
  mockPc = new MockPeerConnection();

  // Stub the global RTCPeerConnection with our mock.
  // We need a real constructor function (not an arrow fn) so that `new` works;
  // returning an object from a constructor causes `new expr` to yield that object.
  vi.stubGlobal('RTCPeerConnection', function MockRTC(this: RTCPeerConnection) {
    return mockPc;
  });

  // RTCSessionDescription just passes through the init dict in tests
  vi.stubGlobal(
    'RTCSessionDescription',
    function MockRTCSD(
      this: RTCSessionDescriptionInit,
      init: RTCSessionDescriptionInit
    ) {
      return init;
    }
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('WebRTCDirect', () => {
  describe('isSupported()', () => {
    it('returns true when RTCPeerConnection is defined', () => {
      expect(WebRTCDirect.isSupported()).toBe(true);
    });

    it('returns false when RTCPeerConnection is not defined', () => {
      vi.stubGlobal('RTCPeerConnection', undefined);
      expect(WebRTCDirect.isSupported()).toBe(false);
    });
  });

  describe('initial state', () => {
    it('starts in idle state and is not connected', () => {
      const wd = new WebRTCDirect(makeCallbacks());
      expect(wd.state).toBe('idle');
      expect(wd.isConnected).toBe(false);
    });
  });

  describe('createOffer()', () => {
    it('transitions to gathering then waiting-for-answer', async () => {
      const cb = makeCallbacks();
      const wd = new WebRTCDirect(cb);

      const offerPromise = wd.createOffer();

      // Simulate ICE gathering completing
      mockPc.simulateIceComplete();

      const code = await offerPromise;
      expect(typeof code).toBe('string');
      expect(code.length).toBeGreaterThan(0);
      expect(wd.state).toBe('waiting-for-answer');
    });

    it('returns a valid base64-encoded JSON string', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      const code = await p;

      // Should decode to an object with a 'type' property
      const decoded = JSON.parse(atob(code));
      expect(decoded).toHaveProperty('type', 'offer');
      expect(decoded).toHaveProperty('sdp');
    });
  });

  describe('acceptOffer()', () => {
    it('creates an answer code from a valid offer code', async () => {
      const cb = makeCallbacks();
      const wd = new WebRTCDirect(cb);

      const offerSDP: RTCSessionDescriptionInit = {
        type: 'offer',
        sdp: 'offer-sdp',
      };
      const offerCode = btoa(JSON.stringify(offerSDP));

      // simulateRemoteDataChannel must fire ondatachannel BEFORE ICE complete
      const answerPromise = wd.acceptOffer(offerCode);
      mockPc.simulateRemoteDataChannel();
      mockPc.simulateIceComplete();

      const answerCode = await answerPromise;
      const decoded = JSON.parse(atob(answerCode));
      expect(decoded).toHaveProperty('type', 'answer');
    });

    it('throws on an invalid (non-base64) offer code', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      await expect(wd.acceptOffer('not-valid-base64!!!')).rejects.toThrow(
        /invalid room code/i
      );
    });

    it('throws on a code that is valid base64 but not a valid SDP object', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      // Valid base64, but setRemoteDescription would fail
      const badCode = btoa(JSON.stringify({ foo: 'bar' }));
      // We mock setRemoteDescription to throw
      mockPc.setRemoteDescription = async () => {
        throw new Error('Invalid SDP');
      };
      await expect(wd.acceptOffer(badCode)).rejects.toThrow('Invalid SDP');
    });
  });

  describe('acceptAnswer()', () => {
    it('calls setRemoteDescription with the decoded answer', async () => {
      const wd = new WebRTCDirect(makeCallbacks());

      // First create an offer so the pc exists
      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      const spy = vi.spyOn(mockPc, 'setRemoteDescription');
      const answerSDP: RTCSessionDescriptionInit = {
        type: 'answer',
        sdp: 'answer-sdp',
      };
      const answerCode = btoa(JSON.stringify(answerSDP));

      await wd.acceptAnswer(answerCode);
      expect(spy).toHaveBeenCalledOnce();
    });

    it('throws if called without a prior createOffer()', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      const code = btoa(JSON.stringify({ type: 'answer', sdp: 'x' }));
      await expect(wd.acceptAnswer(code)).rejects.toThrow(/createOffer/i);
    });

    it('throws on an invalid answer code', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;
      await expect(wd.acceptAnswer('!!!notbase64')).rejects.toThrow(
        /invalid room code/i
      );
    });
  });

  describe('DataChannel callbacks', () => {
    it('calls onConnected and transitions to connected when DataChannel opens', async () => {
      const cb = makeCallbacks();
      const wd = new WebRTCDirect(cb);

      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      // Simulate the DataChannel opening (initiator side)
      const dc = mockPc.getDataChannel() as MockDataChannel;
      dc.simulateOpen();

      expect(wd.state).toBe('connected');
      expect(wd.isConnected).toBe(true);
      expect(cb.onConnected).toHaveBeenCalledOnce();
    });

    it('calls onDisconnected when DataChannel closes after being connected', async () => {
      const cb = makeCallbacks();
      const wd = new WebRTCDirect(cb);

      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      const dc = mockPc.getDataChannel() as MockDataChannel;
      dc.simulateOpen();
      dc.simulateClose();

      expect(wd.isConnected).toBe(false);
      expect(cb.onDisconnected).toHaveBeenCalledOnce();
    });

    it('calls onMessage with the parsed data when a message is received', async () => {
      const cb = makeCallbacks();
      const wd = new WebRTCDirect(cb);

      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      const dc = mockPc.getDataChannel() as MockDataChannel;
      dc.simulateOpen();

      const payload = { type: 'playerUpdate', x: 100, y: 200 };
      dc.simulateMessage(payload);

      expect(cb.onMessage).toHaveBeenCalledOnce();
      expect(cb.onMessage).toHaveBeenCalledWith(payload);
    });

    it('does not crash on malformed (non-JSON) DataChannel messages', async () => {
      const cb = makeCallbacks();
      const wd = new WebRTCDirect(cb);

      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      const dc = mockPc.getDataChannel() as MockDataChannel;
      dc.simulateOpen();

      // Manually fire onmessage with invalid JSON
      dc.onmessage?.(new MessageEvent('message', { data: '{not valid json' }));

      // onMessage should NOT be called
      expect(cb.onMessage).not.toHaveBeenCalled();
    });
  });

  describe('send()', () => {
    it('sends serialised JSON over the DataChannel when connected', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      const dc = mockPc.getDataChannel() as MockDataChannel;
      dc.simulateOpen();

      const spy = vi.spyOn(dc, 'send');
      wd.send({ type: 'ping' });

      expect(spy).toHaveBeenCalledOnce();
      expect(JSON.parse(spy.mock.calls[0][0] as string)).toEqual({
        type: 'ping',
      });
    });

    it('does nothing when not connected', () => {
      const wd = new WebRTCDirect(makeCallbacks());
      // Should not throw even with no peer connection
      expect(() => wd.send({ type: 'ping' })).not.toThrow();
    });
  });

  describe('cleanup()', () => {
    it('resets state to idle and closes the connection', async () => {
      const wd = new WebRTCDirect(makeCallbacks());
      const p = wd.createOffer();
      mockPc.simulateIceComplete();
      await p;

      wd.cleanup();
      expect(wd.state).toBe('idle');
      expect(wd.isConnected).toBe(false);
    });

    it('is safe to call multiple times', () => {
      const wd = new WebRTCDirect(makeCallbacks());
      expect(() => {
        wd.cleanup();
        wd.cleanup();
      }).not.toThrow();
    });
  });
});
