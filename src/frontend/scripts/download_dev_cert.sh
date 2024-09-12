#!/usr/bin/env bash
##
## This script downloads the developer certificate of the extension from marketplace.
##
(
    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    # Input parameters
    pat=$1
    publisher=$2
    extension=$3
    output_file=$4

    # We use 0.0.2 since it's the first version that we published and always available.
    # When a newer version is published, the developer certificate won't change.
    version="0.0.2"

    # Construct url
    url="https://marketplace.visualstudio.com/_apis/gallery/publishers/$publisher/extensions/$extension/certificates/$version"

    # The personal access token needs to be encoded using base64 before passing to the request's header
    pat_b64=$(echo -n ":$pat" | base64)

    # Sending request
    echo "Downloading certificate"
    curl -s -X GET "$url" \
        -H "accept: application/json; api-version=5.2-preview.1" \
        -H "authorization: Basic $pat_b64" \
        -H "cache-control: no-cache" \
        -H "content-type: application/json" \
        > $output_file
)
