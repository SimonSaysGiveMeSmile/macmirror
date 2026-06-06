# MacMirror — Roadmap

Philosophy: **prove it works on real hardware first, then fork and customize.** Each milestone ends in something you can actually use.

---

## Milestone 0 — Verify the concept (this week)

> Goal: see 4K/HDR/120/control work end-to-end on *your* M1 Max + iPad Pro using the unmodified upstreams, so we know exactly what we're forking.

- [ ] M0.1 Build & run **Lumen** (host) on the Mac; grant Screen Recording + Accessibility.
- [ ] M0.2 Install **Moonlight** on the iPad (App Store or build from source).
- [ ] M0.3 Connect over **LAN**, confirm: live desktop, smooth fps, keyboard/trackpad control.
- [ ] M0.4 Toggle HDR + high refresh in Moonlight; observe quality/latency on the XDR panel.
- [ ] M0.5 Note every rough edge (input bugs, extended-display behavior, latency) → feeds the fork backlog.

**Exit:** a working baseline + a written list of what to change. *No code yet.*

---

## Milestone 1 — MVP: mirror + control over our tunnel (the headline)

> Goal: replace Moonlight's pairing with **our QR/token + global-IPv6** flow, on top of the existing stream.

- [ ] M1.1 Fork Lumen → `host/`, moonlight-ios → `client/`; get both building from our tree.
- [ ] M1.2 Tunnel: **mDNS/Bonjour** LAN discovery (`_macmirror._udp`).
- [ ] M1.3 Tunnel: **global IPv6** direct connect (ICE host candidates / direct dial); reachability check.
- [ ] M1.4 Pairing: host generates `macmirror://pair?...` **QR + link** with cert fingerprint + session token.
- [ ] M1.5 Client: **camera QR scan** → parse → **pin fingerprint** → connect (no manual IP).
- [ ] M1.6 Input fixes: Magic Keyboard trackpad raw deltas + pointer lock; keyboard combos.
- [ ] M1.7 QR-free reconnect (persisted device keypairs).

**Exit (MVP success criteria, see PRD):** scan QR → controllable Mac desktop on iPad, on LAN *and* across networks via IPv6.

---

## Milestone 2 — HDR/XDR on the Mac host

> Goal: the one thing no open Mac host does today.

- [ ] M2.1 SCK capture in `.hdrCanonicalDisplay`, 10-bit BT.2100 PQ.
- [ ] M2.2 VideoToolbox HEVC **Main10** HDR encode (verify true 10-bit, not silent 8-bit).
- [ ] M2.3 End-to-end HDR validation on iPad Pro XDR; tone-map fallback on non-XDR.
- [ ] M2.4 Push toward **4K120** on M1 Max; measure thermals/latency.

---

## Milestone 3 — Extended display + orientation

- [ ] M3.1 `CGVirtualDisplay` auto-create/destroy sized to client.
- [ ] M3.2 Extended (real second desktop) vs mirror toggle.
- [ ] M3.3 Orientation: portrait → resize virtual display to portrait aspect; landscape → full.
- [ ] M3.4 Hideable on-screen controls (virtual trackpad/keys), hidden by default.

---

## Milestone 4 — File transfer

- [ ] M4.1 Reliable file channel (both directions) over the tunnel.
- [ ] M4.2 Resumable + integrity-checked.
- [ ] M4.3 iOS Files.app integration + Mac drop target.

---

## Milestone 5 — Hardening & distribution

- [ ] M5.1 E2E crypto review; authenticate every input packet.
- [ ] M5.2 Notarize Developer-ID host; signing/permissions onboarding UX.
- [ ] M5.3 Client TestFlight.
- [ ] M5.4 Congestion control / adaptive bitrate tuning to the link ceiling.

---

## Research spikes (parallel, non-blocking)

- [ ] R1 QUIC/WebTransport transport rewrite — lower latency ceiling than UDP+FEC+ENet?
- [ ] R2 AV1 encode path on top-tier silicon (M4 Ultra / M5) — not viable on M1 Max.
- [ ] R3 macOS 26 behavior of SCK fps cap + CGVirtualDisplay (we're on 26.5).
