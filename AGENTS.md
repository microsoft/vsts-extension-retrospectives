# AGENTS.md - AI Coding Agent Instructions

Instructions for AI coding agents working on the Retrospectives Extension for Azure DevOps.

## Project Overview

Full-stack Azure DevOps extension:

- **Frontend**: React 19 + TypeScript in `src/frontend/`
- **Backend**: .NET 9 (ASP.NET Core + SignalR) in `src/backend/`

## Directory Structure

```text
src/
├── frontend/              # React/TypeScript frontend
│   ├── components/        # React components
│   │   ├── __tests__/     # Jest tests (*.test.tsx)
│   │   └── __mocks__/     # Test mocks
│   ├── dal/               # Data access layer
│   ├── interfaces/        # TypeScript interfaces
│   └── utilities/         # Utility functions
├── backend/               # C#/.NET SignalR backend
└── backend.tests/         # xUnit tests for backend
```

## Build/Lint/Test Commands

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

### Backend (run from `src/backend/`)

```bash
dotnet restore --locked-mode && dotnet build

# Run tests (from src/backend.tests/)
dotnet test
dotnet test --filter "FullyQualifiedName~TestMethodName"  # Single test
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

### C# (Backend)

Follow [C# Coding Conventions](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/inside-a-program/coding-conventions):

- PascalCase for public members/methods/classes
- `_camelCase` for private fields (`_logger`, `_insights`)
- XML documentation comments for public methods
- Async methods return `Task`

```csharp
/// <summary>
/// Broadcast receiveNewItem to all other clients.
/// </summary>
public Task BroadcastNewItem(string reflectBoardId, string columnId, string feedbackItemId)
{
    _logger.LogInformation($"BroadcastNewItem connectionID: {Context.ConnectionId}");
    return Clients.OthersInGroup(reflectBoardId).SendAsync(receiveNewItem.ToString(), columnId, feedbackItemId);
}
```

## Testing

### Frontend (Jest + React Testing Library)

- Test files: `components/__tests__/*.test.tsx`
- Mock Azure DevOps SDK, telemetry, and external services
- Use `@testing-library/react` and `@testing-library/user-event`

### Backend (xUnit + Moq)

- Test files: `src/backend.tests/`
- Use Moq for mocking, Arrange-Act-Assert pattern

## Error Handling

**Frontend**: try/catch with telemetry:

```typescript
try {
  await itemDataService.updateFeedbackItem(item);
} catch (error) {
  appInsights.trackException({ exception: error as Error });
}
```

**Backend**: logging + Application Insights:

```csharp
_logger.LogInformation($"Operation: {Context.ConnectionId}");
_insights.TrackEvent("Event name");
```

## Key Patterns

- **SignalR**: Backend hub `ReflectHub.cs`, frontend `dal/reflectBackendService`
- **Signal names**: Defined in `ReflectBackendSignals` enum
- **Data storage**: Azure DevOps data service (via extension SDK)

## CI/CD

PRs trigger:

1. Frontend: lint, build, test (with coverage)
2. Backend: restore, build, test
3. Pre-commit: gitleaks (secrets), shellcheck, formatting

Always run `npm test` before committing frontend changes.
