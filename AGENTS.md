# AGENTS.md - AI Coding Agent Instructions

Instructions for AI coding agents working on the Retrospectives Extension for Azure DevOps.

## Project Overview

Azure DevOps extension with only a frontend: React 19 + TypeScript in `src/frontend/`.

There is no backend service. All data is stored in the Azure DevOps Extension Data Service, and changes made by other users are picked up by polling.

## Directory Structure

```text
src/
└── frontend/              # React/TypeScript frontend
    ├── components/        # React components
    │   ├── __tests__/     # Jest tests (*.test.tsx)
    │   └── __mocks__/     # Test mocks
    ├── dal/               # Data access layer
    ├── interfaces/        # TypeScript interfaces
    └── utilities/         # Utility functions
```

## Build/Lint/Test Commands

### Tooling Preferences

- Start text searches with `grep`; use `rg` only if it is available and working.
- Frontend Jest runs must use the `jsdom` environment, for example `npx jest --env=jsdom ...`.

### Frontend (run from `src/frontend/`)

```bash
npm ci                     # Install dependencies
npm run build              # Build for production
npm run format             # Format with Prettier
npm test                   # Run all tests with coverage

# Run a single test file
npx jest --env=jsdom components/__tests__/feedbackItem.test.tsx

# Full check (lint + format + pre-commit + test)
npm run check
```

### Pre-commit Hooks

```bash
pre-commit install              # Install hooks
pre-commit run --all-files      # Run on all files
```

## Code Style Guidelines

### TypeScript/React

**Imports** - organize in order:

1. React and hooks
2. Third-party libraries (@fluentui, azure-devops-extension-*)
3. Local interfaces/types
4. Local components
5. Local utilities/services

**Formatting** (Prettier config):

- Tab width: 2 spaces, no tabs
- Arrow parens: avoid (`x => x`)
- Bracket spacing: true

**TypeScript** (tsconfig):

- Target: ES2020, Module: ESNext, JSX: react-jsx
- `noImplicitReturns`, `noImplicitThis`, `noImplicitAny`: true
- `strictNullChecks`: false

**Naming Conventions**:

- Interfaces: PascalCase with `I` prefix (`IFeedbackItemDocument`)
- Components: PascalCase (`FeedbackItem`)
- Component files: camelCase (`feedbackItem.tsx`)
- Props/State interfaces: `I{ComponentName}Props`, `I{ComponentName}State`
- Utilities: camelCase functions (`getUserIdentity`)

**Component Pattern**:

- Functional components with hooks (useState, useEffect, useCallback)
- `forwardRef` + `useImperativeHandle` for ref-exposing components
- Define prop/state interfaces before component

## Testing

### Frontend (Jest + React Testing Library)

- Test files: `components/__tests__/*.test.tsx`
- Mock Azure DevOps SDK, telemetry, and external services
- Use `@testing-library/react` and `@testing-library/user-event`
- The feedback item and board loops poll as soon as they start; the board list loop waits one interval first. To trigger the next poll, advance fake timers past the interval or dispatch `new Event("online")` on `window`, which makes every active loop poll immediately and returns it to the regular pace. The feedback item and board loops slow down to `LIVE_SYNC_IDLE_POLL_INTERVAL_MS` after `DEFAULT_IDLE_AFTER_UNCHANGED_POLLS` polls that found nothing new (the poll that `online` triggers is the first of them), so when a test counts polls, start counting from such an `online` event.

## Error Handling

**Frontend**: try/catch with telemetry:

```typescript
try {
  await itemDataService.updateFeedbackItem(item);
} catch (error) {
  appInsights.trackException({ exception: error as Error });
}
```

Inside a polling loop's `poll` callback, let errors propagate: the loop reports them through `onError` and retries after an increasing delay.

## Key Patterns

- **Live updates**: `startPollingLoop` in `utilities/pollingLoop.ts` polls the open board's feedback items (`feedbackBoard.tsx`) and the open board (`feedbackBoardContainer.tsx`) every 2 seconds, slowing to every 6 seconds while polls keep finding nothing new (a `poll` callback resolves `false` for "nothing new"), and the team's board list every 2 minutes plus whenever the board picker gets focus. Loops pause while the tab is hidden and back off after errors.
- **Poll reads**: use the strict data access methods (`getFeedbackItemsForBoardStrict`, `getBoardsForTeamStrict`, `getBoardForTeamByIdStrict`), which throw on failures instead of returning empty data.
- **Merging**: merge polled documents by `__etag` (`mergeServerFeedbackItems`, `mergePolledBoard`, `mergePolledBoardList`). Keep object identity for unchanged data and never let an older server copy overwrite newer local state.
- **Sharing changes**: save through the data access layer (`dal/`); other users pick up changes on their next poll, so there is nothing to broadcast. "Move everyone" to a phase is detected through the board's `activePhaseUpdatedDate`.
- **Data storage**: Azure DevOps data service (via extension SDK)

## CI/CD

PRs trigger:

1. Frontend: lint, build, test (with coverage)
2. Pre-commit: gitleaks (secrets), shellcheck, formatting

Always run `npm test` before committing frontend changes.
