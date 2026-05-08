#!/usr/bin/env bash

# Build/package and publish an Azure DevOps extension with retry logic.
# Usage: ./scripts/publish_extension.sh <dev|prod> [max_retries] [retry_delay_seconds]
(
    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    if [[ $# -lt 1 ]]; then
        echo "Usage: ./scripts/publish_extension.sh <dev|prod> [max_retries] [retry_delay_seconds]"
        exit 1
    fi

    target="$1"
    max_retries="${2:-3}"
    retry_delay_seconds="${3:-5}"

    if [[ -z "${AZURE_DEVOPS_TOKEN:-}" ]]; then
        echo "AZURE_DEVOPS_TOKEN is not set. Export the token and retry."
        exit 1
    fi

    case "$target" in
        dev)
            manifest="vss-extension-dev.json"
            pack_script="pack:d"
            ;;
        prod)
            manifest="vss-extension-prod.json"
            pack_script="pack:p"
            ;;
        *)
            echo "Invalid target '$target'. Expected 'dev' or 'prod'."
            exit 1
            ;;
    esac

    echo "Packaging extension for '$target' using $manifest"
    npm run "$pack_script"

    # Resolve exactly one VSIX deterministically: newest file in ./dist after packing.
    vsix_path="$(ls -t ./dist/*.vsix 2>/dev/null | head -n 1 || true)"
    if [[ -z "$vsix_path" ]]; then
        echo "No VSIX package found in ./dist after packaging."
        exit 1
    fi

    echo "Publishing VSIX: $vsix_path"

    attempt=1
    while (( attempt <= max_retries )); do
        echo "Publish attempt $attempt/$max_retries"
        if npx tfx extension publish --manifests "$manifest" --vsix "$vsix_path" --token "$AZURE_DEVOPS_TOKEN"; then
            echo "Publish succeeded on attempt $attempt."
            exit 0
        fi

        if (( attempt == max_retries )); then
            echo "Publish failed after $max_retries attempts."
            exit 1
        fi

        echo "Publish failed. Retrying in $retry_delay_seconds seconds..."
        sleep "$retry_delay_seconds"
        attempt=$((attempt + 1))
    done
)
