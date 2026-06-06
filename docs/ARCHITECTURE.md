# MacMirror — Architecture

## System overview

```
┌─────────────────────────── Mac host (host/) ───────────────────────────┐
│                                                                          │
│  ScreenCaptureKit ──► CVPixelBuffer (10-bit, BT.2100 PQ)                 │
│   • real display (mirror)        │                                       │
│   • CGVirtualDisplay (extended)  ▼                                       │
│                          VideoToolbox HEVC Main10                        │
│                          (low-latency, realtime, HW)                     │
│                                  │                                       │
│   CGEvent  ◄── input decode ──┐  ▼                                       │
│   (Accessibility)             │  packetizer (RTP-ish + Reed-Solomon FEC) │
│                               │  │                                       │
│   File I/O ◄── file channel ──┤  │                                       │
└───────────────────────────────┼──┼──────────────────────────────────────┘
                                 │  │
        reliable control channel │  │ lossy media channel (UDP+FEC)
                                 │  │
              ┌──────────────────┴──┴───────────────────┐
              │   TUNNEL (tunnel/)                       │
              │   • ICE / global IPv6 host candidates    │
              │   • mDNS on LAN                          │
              │   • QR/token pairing + cert pinning      │
              │   • E2E encryption                       │
              └──────────────────┬──┬───────────────────┘
                                 │  │
┌────────────────────────────────┼──┼──────────────────────────────────────┐
│                                 ▲  ▼                  iOS client (client/) │
│   GameController (raw deltas) ──┘  VideoToolbox HEVC Main10 decode         │
│   UIKey / GCKeyboard               │                                       │
│   UITouch (multitouch)             ▼                                       │
│   ──► input encode ──►        CAMetalLayer EDR (HDR) @ up to 120 Hz        │
│                               CADisplayLink frame pacing                   │
└───────────────────────────────────────────────────────────────────────────┘
```

## Component responsibilities

### Host (`host/`) — fork of Lumen (Sunshine/Apple-Silicon)
- **Capture**: ScreenCaptureKit. `SCStreamConfiguration.captureDynamicRange = .hdrCanonicalDisplay` (normalizes to BT.2100 PQ for *sending to another device* — exactly our case), 10-bit YCbCr, `minimumFrameInterval` for target fps. Watch the macOS-15 60 fps capture floor regression; feature-detect per OS.
- **Virtual display** (extended mode): private `CGVirtualDisplay` API. Auto-create sized to client, destroy on disconnect. Keep HDR on *real*-display capture; virtual-display HDR is unreliable.
- **Encode**: VideoToolbox `VTCompressionSession`, `kCMVideoCodecType_HEVC`, Main10, `EnableLowLatencyRateControl`, `RealTime`, short keyframe interval, `AverageBitRate`/`DataRateLimits` driven by congestion feedback. 4K120 needs Max/Ultra (dev box = M1 Max ✅).
- **Input injection**: `CGEvent` posted to `kCGHIDEventTap`. Requires **Accessibility** permission; app must be **non-sandboxed**. Multitouch gestures are *emulated* (scroll-wheel w/ momentum), not native.
- **File endpoint**: receive/serve files over the reliable channel.
- **Permissions to request**: Screen Recording (TCC), Accessibility (TCC).

### Client (`client/`) — fork of moonlight-ios
- **Decode/render**: VideoToolbox HEVC Main10 → `CVPixelBuffer` → Metal texture → `CAMetalLayer` with `wantsExtendedDynamicRangeContent = true`, extended color space → HDR on iPad Pro XDR. Already present in Moonlight; we keep it.
- **Frame pacing**: `CADisplayLink.preferredFrameRateRange` up to 120; iPhone needs `CADisableMinimumFrameDurationOnPhone`.
- **Input**: GameController `GCMouse` raw deltas + `prefersPointerLocked` (hides pointer, kills edge system gestures), `GCKeyboard`/`UIKey` for full keyboard, `UITouch` multitouch. Fix known Moonlight issues: M-series Magic Keyboard trackpad dropping after stream start (#626), 3rd-party mouse w/ Magic Keyboard (#422).
- **Pairing UI**: camera QR scan → parse `macmirror://pair?...` → verify fingerprint → connect.
- **File-transfer UI**: new side channel + Files.app integration.

### Tunnel (`tunnel/`) — new, shared
- **Transport (MVP)**: reuse Moonlight's proven split — **lossy UDP + Reed-Solomon FEC for video**, **reliable channel for input/control** (Moonlight uses ENet). Don't reinvent for the MVP.
- **Connectivity**:
  - LAN: **mDNS/Bonjour** `_macmirror._udp` on 5353, TXT = version + pairing port + cert fingerprint.
  - WAN: **ICE** gathering **global IPv6 host candidates** → direct P2P (no TURN when both reachable). Filter `fe80::` link-local. Keep a v6 STUN for reflexive checks; TURN last-resort only.
  - **Firewall note**: public IPv6 ≠ inbound-reachable. The host must accept inbound UDP on the media port; macOS app firewall must allow the helper.
- **Pairing**: QR/link `macmirror://pair?host=<v6>&port=<n>&fp=<host-cert-sha256>&tok=<128-bit token>&v=1` (+ optional LAN hostname). Token authenticates client; `fp` pins host cert → no MITM. On first pair, exchange long-lived device keypairs for QR-free reconnect.
- **Crypto**: mutual-TLS 1.3 / DTLS-SRTP (if WebRTC path) **or** Noise_IK + AES-256-GCM (if custom UDP). Authenticate every input packet.

## Data planes (why two channels)

| Plane | Reliability | Carries | Rationale |
|---|---|---|---|
| Media | Lossy UDP + FEC, no retransmit | Video, audio | Latency > completeness; a late frame is useless |
| Control | Reliable, ordered | Input, pairing, file transfer, session mgmt | A dropped keystroke is unacceptable |

## Build/transport decision for MVP

Two viable transports. For the **MVP we reuse Moonlight's existing UDP+FEC+ENet stack** (it already works, already does IPv6 ICE-ish host connection, already FEC'd) and bolt our **QR/token + IPv6 + cert-pinning** pairing on top. A later milestone may evaluate a **QUIC/WebTransport** rewrite for an even lower latency ceiling (datagrams for video, reliable stream for input) — tracked as a research spike, not MVP work.

## Key risks & mitigations

| Risk | Mitigation |
|---|---|
| macOS 15+ SCK 60 fps capture floor | Feature-detect; apply OBS-style workaround; gate 120 Hz by OS version |
| `CGVirtualDisplay` breaks per OS release | Feature-detect, fallback to mirror, test each beta |
| HDR on virtual display unreliable | Capture real display for HDR; virtual display = SDR extra space |
| Inbound IPv6 firewall blocks | Detect reachability; guide firewall opening; mDNS LAN fallback |
| Moonlight MITM in pairing | QR-delivered cert-fingerprint pinning |
| App Store rejection (host) | Direct-download, Developer-ID, notarized (private API + non-sandboxed) |
