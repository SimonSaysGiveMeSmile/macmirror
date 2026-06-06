# MacMirror Pairing Protocol (v1)

Replaces Moonlight's PIN handshake with a QR/link flow that **pins the host's certificate**, closing the known Moonlight pairing MITM weakness.

## The pairing payload

The host renders this as **both a QR code and a tappable link**:

```
macmirror://pair?host=<ipv6>&port=<udp-port>&fp=<host-cert-sha256-hex>&tok=<base64url-128bit>&v=1
```

Optional fields:
- `lan=<bonjour-hostname>` — LAN fast-path hint for same-network use.
- `name=<url-encoded display name>` — friendly host name shown in the client.

| Field | Meaning | Security role |
|---|---|---|
| `host` | Host global IPv6 address | Where to dial (WAN) |
| `port` | UDP media/control port | — |
| `fp` | SHA-256 of host TLS/Noise cert | **Client pins this** → no MITM |
| `tok` | 128-bit single-use session token | Authenticates the client to the host |
| `v` | Protocol version | Forward-compat |

## Flow

1. **Host** generates (or loads) a long-lived cert keypair, computes `fp`, mints a single-use `tok`, learns its global IPv6 + port, renders QR + link. Token has a short TTL (e.g. 2 min) until consumed.
2. **Client** scans QR (camera) or opens link → parses payload.
3. Client dials `host:port` (LAN `lan` hint first if present, else IPv6), begins TLS 1.3 / Noise_IK handshake.
4. Client **verifies the server cert fingerprint == `fp`**. Abort on mismatch (MITM).
5. Client presents `tok`. Host validates + consumes it.
6. Both sides exchange + persist **long-lived device public keys** → future reconnects skip the QR (device is now trusted).
7. Session keys derived (AES-256-GCM); stream + input begin.

## Threat model notes
- `fp` pinning means a network attacker cannot impersonate the host even if they intercept the dial.
- `tok` is single-use + short-TTL so a leaked QR screenshot has a small window.
- Every **input** packet is authenticated (input injection is the real attack surface — never accept unauthenticated control).
- Loss of the QR after pairing is harmless (token already consumed; trust is now key-based).

## Reconnect (no QR)
Trusted device → mutual key auth against persisted keypairs → straight to session-key derivation. QR only needed for first pair or after an explicit unpair/revoke.

## Open questions (tracked, not yet decided)
- TLS 1.3 mutual-auth vs Noise_IK for the control handshake — pick during M1.4 (depends on whether we keep Moonlight's TLS stack or add Noise).
- Token transport when using LAN mDNS path (still required, or implied by same-network trust?).
