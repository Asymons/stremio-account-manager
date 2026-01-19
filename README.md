# Stremio Account Manager

A client-side React SPA for managing multiple Stremio accounts and their addons. Manage 1-10+ accounts with ease, install/remove addons, and sync configurations across your accounts.

> ⚠️ **Disclaimer**: This is an **unofficial tool** and is not affiliated with Stremio. Use at your own risk. Always keep backups of your important data.

## Features

### MVP Features (Current)

- **Account Management**
  - Add accounts by auth key or username/password
  - View all accounts in a grid layout
  - Remove accounts
  - Sync individual or all accounts
  - Account status indicators (active/error)

- **Addon Management**
  - View addons installed on each account
  - Install addons by URL
  - Remove addons from accounts
  - See addon details (name, version, description, logo)

- **Data Persistence**
  - Auto-save to IndexedDB (with localStorage fallback)
  - AES-256 encryption for auth keys and passwords
  - Export accounts to JSON (with optional credentials)
  - Import accounts from JSON

- **Security**
  - Client-side AES-256 encryption
  - No telemetry or tracking
  - All data stays in your browser

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

# Preview production build
npm run preview
```

### Development

The app will be available at `http://localhost:5173`

## Usage

### Adding Accounts

1. Click "Add Account" in the header
2. Choose to add by:
   - **Auth Key**: Paste your Stremio auth key (found in Stremio settings)
   - **Email & Password**: Enter your Stremio credentials

### Managing Addons

1. Click "View Addons" on any account card
2. To install an addon:
   - Click "Install Addon"
   - Enter the addon URL (e.g., `https://addon.example.com`)
   - The app will fetch the manifest and install it
3. To remove an addon:
   - Click "Remove" on the addon card
   - Protected/official addons cannot be removed

### Export/Import

**Export:**
1. Click "Export" in the header
2. Choose whether to include credentials (auth keys/passwords)
3. ⚠️ Warning: Exported files with credentials contain plain text secrets
4. Save the JSON file

**Import:**
1. Click "Import" in the header
2. Select your exported JSON file
3. Accounts will be added to your existing accounts

### Syncing

- **Sync All**: Syncs all accounts with Stremio servers
- **Sync Individual**: Click "Sync" on an account card
- Accounts are automatically synced when added or modified

## Project Structure

```
src/
├── api/                    # API client and methods
│   ├── stremio-client.ts  # Core Stremio API client
│   ├── auth.ts            # Authentication methods
│   └── addons.ts          # Addon operations
├── components/
│   ├── ui/                # shadcn UI components
│   ├── accounts/          # Account-related components
│   ├── addons/            # Addon-related components
│   ├── layout/            # Layout components
│   ├── ExportDialog.tsx   # Export functionality
│   └── ImportDialog.tsx   # Import functionality
├── hooks/                 # React hooks
│   ├── useAccounts.ts
│   ├── useAddons.ts
│   └── useLocalStorage.ts
├── lib/                   # Utilities
│   ├── encryption.ts      # AES encryption
│   ├── validation.ts      # Zod schemas
│   └── utils.ts           # General utilities
├── store/                 # Zustand stores
│   ├── accountStore.ts    # Account state
│   └── uiStore.ts         # UI state
├── types/                 # TypeScript types
│   ├── account.ts
│   └── addon.ts
├── App.tsx               # Main app component
├── main.tsx              # Entry point
└── index.css             # Global styles
```

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

## Known Limitations (MVP)

- No bulk operations across multiple accounts
- Cannot configure addon settings (API keys for debrid/usenet)
- No drag-drop addon reordering
- Cannot hide/disable Cinemeta addon
- No auto-sync on interval
- No cloud backup

See [future-features.md](./future-features.md) for the complete roadmap.

## Contributing

Contributions are welcome! Please open a pull request with your changes.

## License

MIT License - see [LICENSE](./LICENSE) file for details.
