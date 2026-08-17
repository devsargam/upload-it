# upload-it

Share files from your terminal in seconds. Built for developers and agents.

## Install

```bash
npm i -g @devsargam/upload-it
```

## Usage

```bash
# Upload a file (no account needed, expires in 24h)
upload-it photo.png

# Login for 7-day storage
upload-it login

# List your files
upload-it list

# Logout
upload-it logout
```

## Peer-to-peer

Send a file straight to another machine. The file never touches storage — the
server only helps the two sides find each other.

```bash
# On the sending machine — prints a link and a code, then waits
upload-it send photo.png
```

The receiver has two options. A browser link, so they need nothing installed:

```
https://uploadit.app/r/<code>
```

Or the CLI, if they have it:

```bash
upload-it receive <code>
upload-it receive <code> --out ~/Downloads
```

Codes are single-use and expire after 15 minutes. Both machines must be online
at the same time. Very restrictive networks may block the direct connection.

## Tech Stack

- **CLI** — TypeScript, Node.js
- **API** — Hono on Cloudflare Workers
- **Storage** — Cloudflare R2
- **Auth** — Email OTP with JWT
- **P2P** — WebRTC data channels, Durable Object signalling
- **Frontend** — React Router

## Author

[@devsargam](https://github.com/devsargam)
