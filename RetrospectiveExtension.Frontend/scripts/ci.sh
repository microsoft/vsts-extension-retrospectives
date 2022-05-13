#!/usr/bin/env bash
##
## This script runs the CI tasks
##
(
    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    npm install
    echo "install dependencies"

    npm run lint
    echo "eslint passed"

    npm run build:p
    echo "build passed"

    npm run test
    echo "tests passed"

    npm run pack:test
    echo "pack passed"

    find . -type f -name "*.md" -not -path "./node_modules/*" -print0 | xargs -0 -r markdownlint
    echo "markdownlint passed"

    find . -type f -name "*.md" -not -path "./node_modules/*" -print0 | xargs -0 -r mdspell --report --en-us --ignore-acronyms
    echo "markdown-spellcheck (mdspell) passed"

    detect-secrets-hook --baseline ../.secrets.baseline $(git diff --staged --name-only)
)
