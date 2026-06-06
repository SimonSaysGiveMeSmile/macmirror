# host/

The macOS host app — a fork of [Lumen](https://github.com/trollzem/Lumen) (an Apple-Silicon [Sunshine](https://github.com/LizardByte/Sunshine) fork).

Captures a display with ScreenCaptureKit, encodes HEVC (Main10/HDR planned) via VideoToolbox, injects input via CGEvent, and auto-creates virtual displays for extended mode.

> The fork is not yet vendored here — during Milestone 0 we run the upstream Lumen build directly (see `scripts/run-host.sh` and `docs/ROADMAP.md`). It lands in this directory in Milestone 1 when we add our QR/token + IPv6 pairing.
