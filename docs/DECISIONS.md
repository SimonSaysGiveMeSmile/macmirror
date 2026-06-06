# MacMirror — Decision Log

Records *why* each major choice was made, so we don't relitigate.

## D1 — Fork the Moonlight stack instead of building from scratch
**Decision:** Base host on **Lumen** (Sunshine/Apple-Silicon fork), client on **moonlight-ios**.
**Why:** It's the only open stack already proven at **4K120 + HDR** with hardware codecs and a polished native iOS client (sub-30 ms LAN). Building equivalent quality greenfield is months of work for no near-term benefit. Lumen already solves the two hardest Mac-host problems (ScreenCaptureKit capture + auto virtual displays).
**Cost:** Inherits **GPLv3**. Accepted.

## D2 — Native iOS client, not web/PWA
**Decision:** Native (Metal + VideoToolbox + GameController).
**Why:** iOS Safari blocks **HDR→EDR rendering, Pointer Lock** (no raw trackpad deltas / cursor hide), and **keyboard lock** — three of the four core needs. Web could only ever be a degraded "see my screen" demo. Moonlight-ios is the existence proof native works.

## D3 — Mac host only; ships outside the Mac App Store
**Decision:** Mac-only host, distributed as a **non-sandboxed, notarized, Developer-ID** direct download.
**Why:** Extended display needs the private `CGVirtualDisplay` API (auto-rejected by App Store review), and input injection via `CGEvent` **cannot be sandboxed**. Same model as BetterDisplay. Notarization passes despite the private API (it's a malware scan, not an API audit).

## D4 — Two data planes: lossy media + reliable control
**Decision:** Video/audio over **lossy UDP + Reed-Solomon FEC** (no retransmit); input/control/file over a **reliable** channel.
**Why:** A late video frame is useless (drop it), but a dropped keystroke is unacceptable. This is the proven Moonlight/Sunshine split; we keep it for the MVP rather than reinvent.

## D5 — Connectivity: direct global IPv6 + mDNS, no relay
**Decision:** **ICE host candidates over global IPv6** for WAN (no TURN when both reachable), **mDNS/Bonjour** for LAN.
**Why:** Matches the user's existing Son-of-Anton model (devices already routed over global IPv6). Avoids running relay infrastructure. STUN kept only for reflexive checks; TURN only as a hostile-firewall last resort.
**Watch:** public IPv6 ≠ inbound-reachable — host firewall must accept inbound UDP on the media port.

## D6 — Pairing: QR/link with cert-fingerprint pinning + session token
**Decision:** Host shows `macmirror://pair?host=<v6>&port=<n>&fp=<cert-sha256>&tok=<token>&v=1` as QR + link; client pins `fp`.
**Why:** Token authenticates the client; fingerprint pinning closes the **known Moonlight pairing MITM** weakness (PIN-only handshake). Better than a 4-digit PIN because we control both ends and the iPad has a camera. Persist device keypairs after first pair → QR-free reconnect.

## D7 — HDR captured from a real display, not the virtual one
**Decision:** HDR path captures a physical/real display; the virtual (extended) display is treated as SDR extra space for now.
**Why:** `CGVirtualDisplay` HDR/EDR setup is unreliable; no open tool does HDR on a virtual display. SCK `.hdrCanonicalDisplay` on a real display is solid.

## D8 — MVP reuses Moonlight's transport; QUIC is a later spike
**Decision:** Ship the MVP on the existing UDP+FEC+ENet transport; evaluate QUIC/WebTransport later (R1).
**Why:** Fastest path to a working product. QUIC could lower the latency ceiling but is immature for P2P and not worth blocking the MVP.

---

## Recorded context (from kickoff)
- **Dev hardware:** M1 Max, 64 GB, macOS 26.5, Xcode 26.2, Swift 6.2 — a "Max" chip, so 4K120 HDR encode is in reach.
- **Target client:** iPad Pro with XDR display (true HDR).
- **First milestone chosen by user:** mirror + full control + tunnel (not extended-display-first, not file-transfer-first).
