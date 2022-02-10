#!/usr/bin/env bash
##
## This script installs the tools needed for CI
##
(
    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    # https://github.com/lukeapage/node-markdown-spellcheck
    npm install -g markdown-spellcheck
  
    # https://github.com/igorshubovych/markdownlint-cli
    npm install -g markdownlint-cli

    # Install python & pip
    sudo apt update
    sudo apt-get install -y python3
    sudo apt-get install -y python3-pip

    # https://github.com/Yelp/detect-secrets
    pip3 install detect-secrets==1.1.0

    # https://github.com/pre-commit
    pip3 install pre-commit==2.12.1
)
