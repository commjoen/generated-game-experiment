/**
 * Tests for WebRTC signaling relay via the multiplayer server.
 *
 * These tests verify that the server correctly forwards WebRTC signaling
 * messages (offer, answer, ICE candidates) between peers using the
 * existing WebSocket connection. The WebRTC peer connection itself is
 * browser-only and not tested here; only the server-side relay is.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { WebSocket } from 'ws';
import {
  setupServer,
  teardownServer,
  getTestPort,
} from '../test/server-manager.js';

beforeAll(async () => {
  await setupServer();
  await new Promise((r) => setTimeout(r, 400));
});

afterAll(async () => {
  await teardownServer();
});

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('WebRTC signaling relay', () => {
  function getWsUrl() {
    return `ws://localhost:${getTestPort()}`;
  }

  async function connectAndJoin(playerId: string, name: string) {
    const ws = new WebSocket(getWsUrl());
    const messages: any[] = [];

    await new Promise<void>((resolve) => {
      ws.on('open', () => {
        ws.send(
          JSON.stringify({
            type: 'join',
            playerId,
            name,
            timestamp: Date.now(),
          })
        );
        resolve();
      });
    });

    ws.on('message', (data: any) => {
      messages.push(JSON.parse(data.toString()));
    });

    await wait(200);
    return { ws, messages };
  }

  it('should forward an rtcSignal offer from one player to another', async () => {
    const { ws: ws1, messages: msgs1 } = await connectAndJoin('rtc-p1', 'P1');
    const { ws: ws2, messages: msgs2 } = await connectAndJoin('rtc-p2', 'P2');

    await wait(100);

    // P1 sends an offer to P2 – sdp is an RTCSessionDescription-shaped object
    const fakeOffer = {
      type: 'offer',
      sdp: { type: 'offer', sdp: 'fake-sdp-offer' },
    };
    ws1.send(
      JSON.stringify({
        type: 'rtcSignal',
        targetId: 'rtc-p2',
        signal: fakeOffer,
      })
    );

    await wait(200);

    // P2 should receive the signal from P1
    const signalMsg = msgs2.find(
      (m) => m.type === 'rtcSignal' && m.fromId === 'rtc-p1'
    );
    expect(signalMsg).toBeDefined();
    expect(signalMsg.signal.type).toBe('offer');
    expect(signalMsg.signal.sdp.sdp).toBe('fake-sdp-offer');

    // P1 should NOT receive its own signal
    const selfSignal = msgs1.find(
      (m) => m.type === 'rtcSignal' && m.fromId === 'rtc-p1'
    );
    expect(selfSignal).toBeUndefined();

    ws1.close();
    ws2.close();
  });

  it('should forward an rtcSignal answer back to the initiator', async () => {
    const { ws: ws1, messages: msgs1 } = await connectAndJoin(
      'rtc-ans1',
      'Ans1'
    );
    const { ws: ws2, messages: _msgs2 } = await connectAndJoin(
      'rtc-ans2',
      'Ans2'
    );

    await wait(100);

    // P2 sends an answer back to P1 – sdp is an RTCSessionDescription-shaped object
    const fakeAnswer = {
      type: 'answer',
      sdp: { type: 'answer', sdp: 'fake-sdp-answer' },
    };
    ws2.send(
      JSON.stringify({
        type: 'rtcSignal',
        targetId: 'rtc-ans1',
        signal: fakeAnswer,
      })
    );

    await wait(200);

    const answerMsg = msgs1.find(
      (m) => m.type === 'rtcSignal' && m.fromId === 'rtc-ans2'
    );
    expect(answerMsg).toBeDefined();
    expect(answerMsg.signal.type).toBe('answer');
    expect(answerMsg.signal.sdp.sdp).toBe('fake-sdp-answer');

    ws1.close();
    ws2.close();
  });

  it('should forward ICE candidate signals between peers', async () => {
    const { ws: ws1, messages: _msgs1 } = await connectAndJoin(
      'rtc-ice1',
      'Ice1'
    );
    const { ws: ws2, messages: msgs2 } = await connectAndJoin(
      'rtc-ice2',
      'Ice2'
    );

    await wait(100);

    const fakeCandidate = {
      type: 'ice-candidate',
      candidate: { candidate: 'candidate:1234', sdpMid: 'audio' },
    };
    ws1.send(
      JSON.stringify({
        type: 'rtcSignal',
        targetId: 'rtc-ice2',
        signal: fakeCandidate,
      })
    );

    await wait(200);

    const iceMsg = msgs2.find(
      (m) => m.type === 'rtcSignal' && m.fromId === 'rtc-ice1'
    );
    expect(iceMsg).toBeDefined();
    expect(iceMsg.signal.type).toBe('ice-candidate');
    expect(iceMsg.signal.candidate.sdpMid).toBe('audio');

    ws1.close();
    ws2.close();
  });

  it('should not crash when targeting an unknown player', async () => {
    const { ws: ws1 } = await connectAndJoin('rtc-unknown1', 'U1');

    await wait(100);

    // Send signal to a player that doesn't exist – server should silently ignore
    ws1.send(
      JSON.stringify({
        type: 'rtcSignal',
        targetId: 'nonexistent-player',
        signal: { type: 'offer', sdp: { type: 'offer', sdp: 'fake' } },
      })
    );

    await wait(200);

    // No error thrown; ws1 should still be open
    expect(ws1.readyState).toBe(WebSocket.OPEN);

    ws1.close();
  });
});
