# Update Release Content Before Production Promotion

You are working in `microsoft/vsts-extension-retrospectives`. Update the release-facing content for the latest production promotion so users can reliably understand what changed. Work autonomously: determine the latest release range from the repository, update the content, validate it, and summarize any assumptions.

## Autonomous Release Range

Do not ask which release range to document. Always target the latest production release range ending at the current `HEAD`.

Determine the target production version and previous production version from the best available repo evidence:

1. Inspect `CHANGELOG.md` for the latest existing release headings.
2. Inspect production extension metadata, especially `src/frontend/vss-extension-prod.json`, if it contains a real production version.
3. Inspect Git tags and recent commit history when available.
4. Inspect merged PRs or commit messages since the previous documented production release.

Use these rules:

- The target release range is the latest set of changes intended for production, ending at `HEAD`.
- If a real production version greater than the latest changelog version is present in metadata or Git tags, use that as the target version.
- If production metadata uses a placeholder version and no newer tag is available, infer the target version as the next patch version after the latest `CHANGELOG.md` release heading.
- Treat the previous production version as the release immediately before the target version in `CHANGELOG.md` or Git tags.
- If the changelog is behind by multiple versions, document the full latest production range needed to bring release-facing content current.
- If evidence conflicts, choose the latest semver-like production version reachable from the repo state, proceed, and call out the assumption in the final response.
- Only stop to ask a question if the repo has no usable version signal or no usable Git history to identify changes.

## Files To Update

Update these files as needed:

- `CHANGELOG.md`
- `src/frontend/components/whatsNewDialog.tsx`
- `README.md`, only if the release changes user-facing behavior, setup, screenshots, or core positioning
- `src/frontend/assets/PACKAGE-DESCRIPTION.md`, only if the release changes marketplace-facing behavior, screenshots, or positioning

Do not manually edit generated files such as coverage output or bundled distribution files unless this repo's release process explicitly requires it.

## What To Review

Before editing, inspect the changes between the inferred previous production version and inferred target production version. Use the best available local and GitHub context, such as:

- merged PRs in the release range
- commit history in the release range
- existing changelog entries
- current What's New content
- README and package description content

Identify user-facing features, behavior changes, bug fixes, accessibility improvements, reliability improvements, and meaningful non-dependency maintenance changes. Exclude noisy internal churn unless it matters to users, operators, maintainers, security, performance, or reliability.

Do not include dependency-only updates in release-facing content. Exclude Dependabot PRs, package manager updates, lockfile-only changes, and dependency or devDependency version changes in files such as `package.json`, `package-lock.json`, `.csproj`, or `packages.lock.json`. If a PR only updates dependencies or dependency metadata, ignore it for `CHANGELOG.md`, What's New, README, and package description updates.

## Changelog Requirements

Update `CHANGELOG.md` so it is accurate for the inferred target production version.

- The top release section must be `## <inferred target production version>`.
- The changelog must not start with `unpublished`, `unreleased`, or any placeholder release heading.
- The changelog must not be ahead of or behind the promoted version.
- The target version entry must be comprehensive for the release.
- Include meaningful user-facing changes, fixes, accessibility updates, reliability improvements, and relevant non-dependency maintenance items.
- Do not include dependency updates, Dependabot PRs, lockfile changes, or package manifest dependency/devDependency version bumps.
- Keep entries concise but specific enough that users and maintainers understand what changed.
- Preserve the repo's existing changelog style, including PR links where available.
- Use past tense consistently.
- Do not use future tense or roadmap language such as "will add", "will fix", "will improve", "coming soon", or "planned".

## What's New Requirements

Update `src/frontend/components/whatsNewDialog.tsx` so the in-app What's New dialog accurately highlights the inferred promoted release.

- Mention the inferred target version, or the exact promoted version range if multiple versions are being promoted together.
- Include only highlights, not the full changelog.
- Prefer 3 to 7 concise items focused on changes users are likely to notice or care about.
- Include major fixes and reliability/accessibility improvements when they affect users.
- Omit low-level maintenance unless it has clear user impact.
- Omit dependency updates, Dependabot PRs, lockfile changes, and package manifest dependency/devDependency version bumps.
- Use past tense consistently.
- Do not use future tense or roadmap language.
- Keep the existing component structure and style unless a minimal structural change is required.

## README And Package Description Requirements

Review `README.md` and `src/frontend/assets/PACKAGE-DESCRIPTION.md` after updating the changelog and What's New.

- Update them only when the release changes user-facing behavior, setup instructions, screenshots, core workflows, feature positioning, or marketplace-facing descriptions.
- If no update is needed, leave them unchanged and mention that in the final summary.
- Keep README and package description wording stable; avoid turning release notes into marketing copy.

## Validation

After editing:

- Verify the inferred target version appears in `CHANGELOG.md`.
- Verify the first changelog release heading matches the inferred target production version.
- Verify `src/frontend/components/whatsNewDialog.tsx` mentions the inferred target version or target release range.
- Search the updated release text for future-tense phrases and remove any that imply upcoming work instead of completed work.
- Run the narrowest useful validation available, such as markdown/editor diagnostics and focused frontend tests if the What's New component or tests changed.

## Final Response

Summarize:

- The release range reviewed
- How the target and previous production versions were inferred
- Files changed
- The main changelog themes added
- The What's New highlights added
- Whether README or package description changes were needed
- Validation performed and any remaining limitations
