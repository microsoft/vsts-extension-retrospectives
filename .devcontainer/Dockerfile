FROM mcr.microsoft.com/vscode/devcontainers/dotnet:0-6.0-bullseye-slim

# Avoid warnings by switching to noninteractive
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  #
  # Configure apt and install common packages
  && apt-get -y install --no-install-recommends apt-utils dialog iproute2 procps sudo \
  #
  # Verify wget, jq, unzip, git and process tools installed
  && apt-get -y install git wget zip unzip jq \
  #
  # Upgrade existing packages
  && apt-get -y upgrade \
  #
  # Install node
  && curl -sL https://deb.nodesource.com/setup_16.x | bash - \
  && apt install -y nodejs \
  #
  # Install jest-cli testing framework globally
  && npm install -g jest-cli markdown-spellcheck markdownlint-cli \
  #
  # Clean up
  && apt-get autoremove -y \
  && apt-get clean -y \
  && rm -rf /var/lib/apt/lists/*

# Switch back to dialog for any ad-hoc use of apt-get
ENV DEBIAN_FRONTEND=

CMD ["bash"]
