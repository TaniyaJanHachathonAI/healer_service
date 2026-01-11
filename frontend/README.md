# Selector Healing Service - Frontend

A modern, responsive React frontend for the Selector Healing Service dashboard.

## Features

- 🎨 **Modern UI** - Clean, professional design with responsive layout
- 🔧 **Single Heal** - Heal individual CSS/XPath selectors
- ⚡ **Batch Heal** - Process up to 10 selectors at once
- 📜 **History** - Browse past healings with pagination and filtering
- 📈 **Statistics** - View performance metrics and usage statistics
- 💬 **Feedback** - Submit feedback to improve the service
- 💚 **Health Monitoring** - Real-time health status in sidebar

## Prerequisites

- Node.js 16+ and npm/yarn/pnpm
- Backend API (optional - currently using mock data for UI demonstration)

## Current Status

⚠️ **Note**: The frontend is currently using **mock data** for demonstration. The UI is fully functional and ready, but backend API integration will be added later. See `API_INTEGRATION.md` for details on integrating the backend API.

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
```

3. (Optional) Configure API URL in `.env` file:
```bash
cp .env.example .env
# Edit .env if your backend runs on a different URL
```

## Development

Start the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

The app will be available at `http://localhost:3000`

The Vite dev server is configured to proxy API requests to `http://localhost:8000` by default.

## Building for Production

Build the production bundle:

```bash
npm run build
# or
yarn build
# or
pnpm build
```

The built files will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
# or
yarn preview
# or
pnpm preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable components (Layout)
│   ├── pages/            # Page components
│   │   ├── Dashboard.tsx
│   │   ├── SingleHeal.tsx
│   │   ├── BatchHeal.tsx
│   │   ├── History.tsx
│   │   ├── Stats.tsx
│   │   └── Feedback.tsx
│   ├── services/         # API service layer
│   │   └── api.ts
│   ├── types/            # TypeScript type definitions
│   │   └── index.ts
│   ├── App.tsx           # Main app component with routing
│   ├── main.tsx          # Entry point
│   └── index.css         # Global styles
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## API Integration

The frontend expects the following API endpoints:

- `POST /heal` - Single selector healing
- `POST /heal-batch` - Batch selector healing
- `GET /history` - Get healing history with pagination
- `GET /stats` - Get statistics
- `POST /feedback` - Submit feedback
- `GET /health` - Health check

See `src/services/api.ts` for API client implementation.

## Environment Variables

- `VITE_API_BASE_URL` - Base URL for the API (default: `/api`)
  - Set to `/api` to use the proxy in `vite.config.ts`
  - Or set to full URL like `http://localhost:8000` to call directly

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Vite** - Build tool and dev server
- **CSS3** - Styling with custom CSS

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

Part of the Healer Service project.
