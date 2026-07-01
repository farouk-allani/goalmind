# GoalMind — Contributing Guide

## Development Setup

```bash
# Clone the repository
git clone https://github.com/farouk-allani/goalmind.git
cd goalmind

# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS
npx expo run:ios

# Run on Android
npx expo run:android
```

## Project Structure

```
goalmind/
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation
│   ├── _layout.tsx        # Root layout
│   └── match/[id].tsx     # Match detail view
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── analysis/         # Match analysis components
│   ├── wallet/           # Wallet components
│   └── prediction/       # Prediction components
├── lib/                   # Core logic
│   ├── ai/               # QVAC integration
│   ├── wallet/           # WDK integration
│   ├── data/             # Football data
│   └── utils/            # Utilities
├── hooks/                 # Custom React hooks
├── stores/               # State management (Zustand)
├── types/                # TypeScript types
└── assets/               # Images, fonts, models
```

## Code Style

- **TypeScript** — All code must be typed
- **Functional components** — No class components
- **Hooks** — Use custom hooks for logic reuse
- **Dark theme** — All UI must use the dark theme colors from `types/index.ts`
- **No AI slop** — Clean, readable code with meaningful names

## Git Workflow

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes with clear commits
3. Push and create PR
4. Merge after review

## Commit Messages

Follow conventional commits:

```
feat: add new feature
fix: fix bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add tests
chore: maintenance tasks
```

## Testing

```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint
```

## Building for Production

```bash
# Build for iOS
npx expo build:ios

# Build for Android
npx expo build:android
```

## License

MIT — See LICENSE file
