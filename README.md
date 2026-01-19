# Stremio Account Manager

A client-side React SPA for managing multiple Stremio accounts and their addons. Manage 1-10+ accounts with ease, install/remove addons, and sync configurations across your accounts.

> ⚠️ **Disclaimer**: This is an **unofficial tool** and is not affiliated with Stremio. Use at your own risk. Always keep backups of your important data.

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

## Contributing

Contributions are welcome! Please open a pull request with your changes.

## License

MIT License - see [LICENSE](./LICENSE) file for details.
