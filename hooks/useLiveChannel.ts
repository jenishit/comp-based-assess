"use client";
import { useEffect, useRef } from "react";
import { wsTicketService } from "@/services/exam-service";

// Next.js rewrites don't reliably proxy WebSocket upgrade requests, so this
// connects directly to the backend origin rather than through /api/v1.
function wsBase(): string {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:8001/api/v1";
  return base.replace(/^http/, "ws");
}

const HEARTBEAT_INTERVAL_MS = 25_000;
const RECONNECT_BASE_DELAY_MS = 1_000;
const RECONNECT_MAX_DELAY_MS = 30_000;

interface UseLiveChannelOptions {
  /** Which backend channel to subscribe to; null disables the hook. */
  target: { attemptId: string } | { examId: string } | null;
  onMessage: (payload: unknown) => void;
}

/**
 * Authenticated live-feed subscription (teacher side).
 *
 * The WS handshake can't carry an Authorization header and the client no
 * longer holds any token, so each (re)connection first mints a single-use
 * ticket via the authenticated REST proxy, then dials the socket with it.
 * Reconnects with exponential backoff if the connection drops, and sends
 * a ping heartbeat so half-dead connections are noticed and replaced.
 */
export function useLiveChannel({ target, onMessage }: UseLiveChannelOptions): void {
  const onMessageRef = useRef(onMessage);
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  const targetKey = target === null ? null : "attemptId" in target ? `attempt:${target.attemptId}` : `exam:${target.examId}`;

  useEffect(() => {
    if (!target || !targetKey) return;

    let ws: WebSocket | null = null;
    let heartbeatId: ReturnType<typeof setInterval> | null = null;
    let reconnectId: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    let disposed = false;

    const wsPath = "attemptId" in target
      ? `/ws/attempts/${target.attemptId}`
      : `/ws/exams/${target.examId}`;

    const connect = async () => {
      let ticket: string;
      try {
        ticket = await wsTicketService(target);
      } catch {
        scheduleReconnect();
        return;
      }
      if (disposed) return;

      ws = new WebSocket(`${wsBase()}${wsPath}?ticket=${encodeURIComponent(ticket)}`);

      ws.onopen = () => {
        attempts = 0;
        heartbeatId = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) ws.send("ping");
        }, HEARTBEAT_INTERVAL_MS);
      };

      ws.onmessage = (msg) => {
        if (msg.data === "pong") return;
        try {
          onMessageRef.current(JSON.parse(msg.data));
        } catch {
          /* ignore malformed frames */
        }
      };

      ws.onclose = () => {
        if (heartbeatId !== null) clearInterval(heartbeatId);
        heartbeatId = null;
        scheduleReconnect();
      };
    };

    const scheduleReconnect = () => {
      if (disposed) return;
      const delay = Math.min(RECONNECT_BASE_DELAY_MS * 2 ** attempts, RECONNECT_MAX_DELAY_MS);
      attempts += 1;
      reconnectId = setTimeout(connect, delay);
    };

    connect();

    return () => {
      disposed = true;
      if (heartbeatId !== null) clearInterval(heartbeatId);
      if (reconnectId !== null) clearTimeout(reconnectId);
      if (ws) {
        ws.onclose = null; // don't reconnect on deliberate teardown
        ws.close();
      }
    };
    // targetKey captures the identity of `target`'s contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetKey]);
}
