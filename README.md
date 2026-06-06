# MacMirror

An open-source [Sidecar](https://support.apple.com/en-us/102189)/Luna-Display alternative: turn an **iPad or iPhone into a wireless display + control surface for your Mac**, over the local network *or* the open internet via direct global IPv6 — the same way [Son of Anton] connects devices.

It aims for the **system's theoretical performance ceiling**: up to **4K · 120 Hz · HDR/XDR**, hardware-encoded, low latency, with full keyboard / trackpad / touch control and two-way file transfer. Pairing is a **QR code or link carrying a session token**.

> Status: **early scaffolding.** We are forking a proven streaming stack and building the parts it lacks (tunnel, pairing, file transfer, Mac-host HDR). See [docs/ROADMAP.md](docs/ROADMAP.md).

## Why this is achievable quickly

We are **not** building a video-streaming engine from scratch. The [Moonlight](https://moonlight-stream.org/) protocol ecosystem already delivers 4K120 + HDR with hardware codecs and a polished native iOS client. We fork it and add what's missing:

| Component | Base (forked) | What we add |
|---|---|---|
| **Host** (`host/`) | [Lumen](https://github.com/trollzem/Lumen) — Apple-Silicon Sunshine fork (ScreenCaptureKit capture, auto virtual displays) | Mac-host **HDR** encode, our pairing/tunnel, file-transfer endpoint |
| **Client** (`client/`) | [moonlight-ios](https://github.com/moonlight-stream/moonlight-ios) — HEVC Main10 HDR, 120 Hz, full input | QR/token pairing UI, file-transfer UI, input edge-case fixes, orientation handling |
| **Tunnel** (`tunnel/`) | *new* | IPv6 direct-connect + QR/token pairing + cert-fingerprint pinning |

## Architecture in one paragraph

The Mac host captures a display (or an auto-created **virtual** display for true extended-desktop) with **ScreenCaptureKit** in 10-bit HDR, encodes **HEVC Main10** in hardware via **VideoToolbox** (low-latency mode), and streams it. Video rides **lossy UDP + FEC** (drop, never stall); input rides a **reliable channel** so keystrokes are never delayed by video congestion. Connectivity uses **ICE host candidates over global IPv6** (no TURN needed when both ends are reachable — your existing model), with **mDNS/Bonjour** for the LAN fast-path. The iPad client decodes HEVC HDR into a **CAMetalLayer EDR** surface at up to 120 Hz, and forwards **raw trackpad deltas (GameController), full keyboard, and multitouch**. Pairing is a **QR/link** carrying `host-IPv6 + port + cert-SHA256 + session-token`; the client **pins the fingerprint** (closing a known Moonlight MITM weakness).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detail and [docs/DECISIONS.md](docs/DECISIONS.md) for the rationale behind every major choice.

## Hard constraints (consequences of the tech)

- **Native, not web.** iOS Safari has no HDR→EDR, no Pointer Lock (no raw trackpad deltas / cursor hide), no keyboard lock. A web client can only be a degraded demo.
- **Not Mac App Store.** Extended display needs the private `CGVirtualDisplay` API, and input injection (`CGEvent`) can't be sandboxed. Ships as a **non-sandboxed, notarized, Developer-ID, direct-download** app (like BetterDisplay).
- **HDR + 4K120 need the right silicon.** Capture HDR needs **macOS 15+**; 4K120 HEVC realtime needs an **M-series Max/Ultra**. (Dev machine: M1 Max / macOS 26.5 — ✅.)
- **License: GPLv3**, inherited from forking Moonlight.

## Layout

```
docs/      PRD, architecture, roadmap, decision log
host/      Mac host app (fork of Lumen)
client/    iOS/iPadOS app (fork of moonlight-ios)
tunnel/    IPv6 connectivity + QR/token pairing + shared protocol
scripts/   dev/build/run helpers
```

[Son of Anton]: the user's existing system that connects devices directly over global IPv6.
