#!/usr/bin/env bash
##
## This script updates the extension manifest file.
##
(
    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    # Input parameters
    ext_file=$1
    publisher=$2
    ext_prefix=$3
    pat=$4

    # Remove baseUri
    cat <<< $(jq 'del(.baseUri)' $ext_file) > $ext_file

    # Inject Publisher Id
    cat <<< $(jq ".publisher = \"$publisher\"" $ext_file) > $ext_file

    # Inject Extension Id and Name
    cat <<< $(jq ".id = \"$ext_prefix-retrospective-vsts-extension-dev\"" $ext_file) > $ext_file
    cat <<< $(jq ".name = \"$ext_prefix - Retrospectives (Dev)\"" $ext_file) > $ext_file

    # Inject version
    ext_info=$(tfx extension show \
        --no-prompt \
        --json \
        --publisher $publisher \
        --extensionId $ext_prefix-retrospective-vsts-extension-dev \
        --token $pat)

    if [[ "$ext_info" != "null" ]]; then
        version=$(jq -r '.versions[0].version' <<< "$ext_info")
        cat <<< $(jq ".version = \"$version\"" $ext_file) > $ext_file
    fi

    # Inject Properties' Name
    cat <<< $(jq ".contributions[0].properties.name = \"$ext_prefix Retrospectives (Dev)\"" $ext_file) > $ext_file
)
