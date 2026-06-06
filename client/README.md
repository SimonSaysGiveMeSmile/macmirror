# client/

The iPad/iPhone client — a fork of [moonlight-ios](https://github.com/moonlight-stream/moonlight-ios).

Decodes HEVC Main10 HDR into a `CAMetalLayer` EDR surface at up to 120 Hz, and forwards raw trackpad deltas (GameController), full keyboard, and multitouch.

> The fork is not yet vendored here. It lands in Milestone 1 when we replace Moonlight's PIN pairing with our QR-scan + session-token + cert-fingerprint-pinning flow (`tunnel/protocol/PAIRING.md`). Fork points identified: `Limelight/Network/PairManager`, `Limelight/Crypto/CryptoManager`, `MDNSManager`/`DiscoveryManager`.
