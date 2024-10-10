#!/usr/bin/env bash

cd "$(dirname "$0")/.." || exit
set -euo pipefail

ext_file=$1
publisher=$2
ext_prefix=$3
pat=$4

cat <<< $(jq 'del(.baseUri)' $ext_file) > $ext_file

cat <<< $(jq ".publisher = \"$publisher\"" $ext_file) > $ext_file

ext_info=$(npx tfx extension show --no-prompt --json --publisher $publisher --extensionId $ext_prefix --token $pat)

if [[ "$ext_info" != "null" ]]; then
  version=$(jq -r '.versions[0].version' <<< "$ext_info")
  cat <<< $(jq ".version = \"$version\"" $ext_file) > $ext_file
fi

cat <<< $(jq ".contributions[0].properties.name = \"Retrospectives (Dev)\"" $ext_file) > $ext_file
