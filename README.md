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

## Tech Stack

- **CLI** — TypeScript, Node.js
- **API** — Hono on Cloudflare Workers
- **Storage** — Cloudflare R2
- **Auth** — Email OTP with JWT
- **Frontend** — React Router

## Author

[@devsargam](https://github.com/devsargam)
