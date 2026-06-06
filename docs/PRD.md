# MacMirror — Product Requirements

## Vision

Use an iPad/iPhone as a wireless display and control surface for a Mac, at the Mac's native fidelity, anywhere — on the same Wi-Fi or across the internet over direct global IPv6. Open source, self-hosted, no cloud middleman.

## Users & primary jobs

- **Mac owner with an iPad** who wants a wireless second screen or remote access to their Mac from a couch, another room, or another city.
- Jobs: (1) *mirror* the Mac to control it remotely; (2) *extend* the Mac onto the iPad as a real second display; (3) *move files* between the two.

## Functional requirements

### F1 — Display streaming
- F1.1 Stream a chosen Mac display to the client.
- F1.2 **Mirror mode**: stream an existing physical display.
- F1.3 **Extended mode**: auto-create a virtual display sized to the client, stream that.
- F1.4 Resolutions up to **4K**; refresh up to **120 Hz** where hardware allows.
- F1.5 **HDR/XDR**: 10-bit HEVC Main10, BT.2100 PQ, rendered into the iPad's EDR display.
- F1.6 Adaptive bitrate: fill available bandwidth up to a configurable ceiling; shed quality (not latency) under congestion.

### F2 — Control input
- F2.1 Touch → cursor (direct-touch and trackpad-emulation modes).
- F2.2 **Magic Keyboard** full key support incl. modifiers and Mac combos.
- F2.3 **Magic Keyboard trackpad**: raw deltas → smooth Mac cursor; two-finger scroll; tap/click.
- F2.4 On-screen controls (e.g. a hideable virtual trackpad / keys), **hidden by default**.
- F2.5 Input must never be delayed by video congestion (separate reliable channel).

### F3 — Orientation
- F3.1 Landscape: full streamed desktop.
- F3.2 Portrait: in **extended mode**, resize the virtual display to the portrait aspect (preferred); in **mirror mode**, letterbox/pan a portion.

### F4 — File transfer
- F4.1 Mac → device and device → Mac, over the same tunnel.
- F4.2 Works on LAN and over global IPv6.
- F4.3 Resumable / integrity-checked for large files.

### F5 — Connectivity
- F5.1 **LAN**: zero-config discovery (mDNS/Bonjour).
- F5.2 **Internet**: direct connection via the host's **global IPv6** address (no relay when reachable).
- F5.3 Graceful fallback path documented (STUN reflexive check; TURN only as last resort).

### F6 — Pairing & security
- F6.1 Pair by **scanning a QR code** shown on the Mac, or opening a **link with a session token**.
- F6.2 Token is only obtainable from the host (host displays/share-sheets it).
- F6.3 Client **pins the host certificate fingerprint** from the QR/link (prevents MITM).
- F6.4 Stream + input fully **end-to-end encrypted**; every input packet authenticated.
- F6.5 After first pair, devices remember each other → QR-free reconnect.

## Non-functional requirements

- **Latency**: target < 30 ms glass-to-glass on LAN; usably low over IPv6 WAN.
- **Quality ceiling**: the system's theoretical max for the link; never artificially capped below hardware/bandwidth limits.
- **Security**: no unauthenticated control of the Mac, ever.
- **Distribution**: notarized Developer-ID host; client via TestFlight/sideload (App Store likely blocked by the same constraints as host? — client itself *can* ship to App Store; the **host** cannot).

## Explicit non-goals (for now)

- Windows/Linux hosts (Mac host only — that's the whole point).
- Android client.
- A cloud relay service (we rely on direct IPv6; relay is a future fallback).
- Multi-user / multi-seat.

## MVP definition (Milestone 1)

A single, demonstrable loop: **Mac mirrors to iPad over the IPv6 tunnel, paired by QR, fully controllable with Magic Keyboard + trackpad + touch.** HDR, extended display, and file transfer come in later milestones. See [ROADMAP.md](ROADMAP.md).

## Success criteria for the MVP

1. Scan QR on iPad → connected, no manual IP entry.
2. Works both on same Wi-Fi and across two networks via global IPv6.
3. Live Mac desktop visible and smooth (≥60 fps, ideally 120).
4. Keyboard + trackpad + touch all drive the Mac with no perceptible lag on LAN.
