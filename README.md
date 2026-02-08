# LAN File Share

A simple LAN file-sharing server with login. Share files from a folder on your computer; other devices on the same network can browse and download them via the browser.

**Version:** 1.0.0

---

## What you need to add (before first run)

| Item | Action |
|------|--------|
| **`.env`** | **Required.** Copy from `.env.example`: `copy .env.example .env` (Windows) or `cp .env.example .env` (Linux/macOS). Then set: `LOGIN_USERNAME`, `LOGIN_PASSWORD`, and optionally `PORT` (default 3000), `SHARED_FOLDER` (default `shared`), `SESSION_SECRET` for production. |
| **`shared/`** | Folder for files to share. You can create it manually or let the server create it on first run. Put any files you want to share inside this folder. |
| **`config.json`** | Optional. A sample is in the repo. To use a different folder path or name, set `sharedFolder` (e.g. `"shared"` or an absolute path). If missing, the server uses `.env`’s `SHARED_FOLDER` or the default `shared`. |

**Summary:** Create `.env` from `.env.example` and set login credentials. Ensure the `shared` folder exists (or the path you set in `config.json` / `.env`); the server can create it if it doesn’t exist.

---

## Requirements

- Node.js 18+

## Setup

```bash
npm install
```

Create `.env` from `.env.example` and set at least:

- `LOGIN_USERNAME` – login username  
- `LOGIN_PASSWORD` – login password  
- Optional: `PORT` (default 3000), `SHARED_FOLDER` (default `shared`), `SESSION_SECRET`

Create or use the **`shared`** folder (or the path in `config.json` / `SHARED_FOLDER`) and put the files you want to share there.

## Run

| Method | Command / File |
|--------|----------------|
| Terminal | `npm start` or `node server.js` |
| Windows (IP + QR) | `start.bat` |

The server listens on `http://0.0.0.0:PORT`. Open `http://YOUR_IP:PORT` from other devices on the same LAN. The batch file shows the URL and a QR code.

## Optional: build EXE (Windows)

```bash
npm run build
```

The executable is created in `dist/lan-file-share.exe`. Copy the `dist` folder (including `.env`, `config.json`, and the `shared` folder or your chosen share path) to another machine. Run `start-exe.bat` or the exe directly; `.env` and `config.json` must be in the same folder as the exe.

## Optional: static IP (Windows)

- **`set-static-ip.bat`** – Run as Administrator to set the current IP as static (so the LAN URL doesn’t change).
- **`iptal-static-ip.bat`** – Run as Administrator to switch back to DHCP.

## Project structure

- `server.js` – Express server, login, file listing, download
- `public/index.html` – Simple file browser UI
- `config.json` – Optional; `sharedFolder` overrides default
- `shared/` – Default folder for shared files (in `.gitignore` except `.gitkeep`)
