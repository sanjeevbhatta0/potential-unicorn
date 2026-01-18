# NewsChautari - Web Application

This is the web frontend for the NewsChautari, built with Next.js 14 using the App Router.

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **Axios** - HTTP client

## Getting Started

### Prerequisites

- Node.js 18+ or 20+
- pnpm (recommended) or npm

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment variables
cp .env.local .env.local
# Update the API URL and other settings as needed
```

### Development

```bash
# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Build

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Project Structure

```
src/
├── app/                    # App Router pages and layouts
│   ├── layout.tsx         # Root layout with providers
│   ├── page.tsx           # Home page
│   ├── articles/          # Article detail pages
│   ├── categories/        # Category pages
│   ├── search/            # Search page
│   └── api/               # API routes
├── components/
│   ├── features/          # Feature-specific components
│   │   └── articles/      # Article components
│   ├── layout/            # Layout components
│   └── ui/                # Reusable UI components
└── lib/
    ├── api/               # API client
    ├── hooks/             # Custom React hooks
    ├── store/             # Zustand stores
    └── utils/             # Utility functions
```

## Features

- **News Feed** - Browse latest articles with pagination
- **Article Detail** - Read full articles with metadata
- **Categories** - Filter articles by category
- **Search** - Search across all articles
- **Trending Articles** - See what's popular
- **Bookmarks** - Save articles for later (client-side)
- **Responsive Design** - Works on all devices

## Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_TIMEOUT=30000
NEXT_PUBLIC_APP_NAME="NewsChautari"
NEXT_PUBLIC_ITEMS_PER_PAGE=20
```

## Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## Contributing

This is part of the Potential Unicorn monorepo. See the root README for contribution guidelines.

## License

MIT
