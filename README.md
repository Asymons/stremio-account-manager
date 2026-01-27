# Stremio Account Manager

https://stremio-account-manager.pages.dev/

A client-side React SPA for managing multiple Stremio accounts and their addons. Manage 1-10+ accounts with ease, install/remove addons, and sync configurations across your accounts.

> ⚠️ **Disclaimer**: This is an **unofficial tool** and is not affiliated with Stremio. Use at your own risk. Always keep backups of your important data.

## Demo

https://github.com/user-attachments/assets/a0d7b566-e830-4142-bb32-1f575b52e6fb

## Features

- Client-side only - All data stored locally with encrypted credentials (no cloud storage)
- Multiple account management - Manage 1-10+ Stremio accounts from one interface
- Saved addons library - Save addons from accounts or create manually, then apply to all accounts
- Tag organization - Organize addons with tags and apply/remove by tag
- Bulk operations - Add, remove, or update addons across multiple accounts simultaneously
- Addon reordering - Drag-and-drop interface to reorder addons
- Export/Import - Backup and restore accounts and saved addons

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **localforage** - IndexedDB storage
- **axios** - HTTP client
- **crypto-js** - Encryption
- **zod** - Validation

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Development

The app will be available at `http://localhost:5173`

## Deployment

### Cloudflare Pages

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy to Cloudflare Pages:
   - Connect your GitHub repository to Cloudflare Pages
   - Set build command: `npm run build`
   - Set output directory: `dist`
   - Deploy

The app will be automatically deployed on every push to your main branch.

### Docker

> **⚠️ Important: Web Crypto API Requirement**
>
> This app uses the **Web Crypto API** to encrypt Stremio credentials locally. Browsers require a **secure context** (HTTPS or localhost) for this to work. Accessing via local IP address (e.g., `http://192.168.1.50:8080`) will cause encryption errors unless you use one of the solutions below.

#### Quick Start (Localhost Only)

```bash
# Using docker-compose (recommended)
docker-compose up -d

# Or using docker run
docker build -t stremio-account-manager .
docker run -d -p 8080:80 --name stremio-account-manager stremio-account-manager
```

**Access:** http://localhost:8080

Browsers treat `localhost` as a secure context even over HTTP, so encryption works without any additional setup.

#### Network Access from Other Devices

If you need to access the app from other devices (phone, tablet, another computer), you have two options:

##### Option 1: Use a Reverse Proxy (Recommended)

Set up a reverse proxy like [Nginx Proxy Manager](https://nginxproxymanager.com/), [Caddy](https://caddyserver.com/), or [Traefik](https://traefik.io/) to serve the app over HTTPS with an SSL certificate.

##### Option 2: Browser Bypass (Chrome/Edge Only)

Force Chrome or Edge to treat your server's IP as secure:

1. Open Chrome or Edge and navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2. Add your server's address: `http://192.168.x.x:8080` (replace with your actual IP)
3. Change the dropdown to **Enabled**
4. Relaunch your browser
5. Access the app at `http://YOUR_IP:8080`

**Note:** This is a workaround for development/personal use. It only works in Chrome/Edge and must be configured on each device.

#### Stopping the Container

```bash
# Using docker-compose
docker-compose down

# Or using docker
docker stop stremio-account-manager
docker rm stremio-account-manager
```

## Contributing

Contributions are welcome! Please open a pull request with your changes.

## License

MIT License - see [LICENSE](./LICENSE) file for details.
