SHELL := /bin/bash

.ONESHELL:

.PHONY: publish

prepare:
	set -euo pipefail

	pushd src/frontend

	export AZURE_DEVOPS_TOKEN=$$(az account get-access-token --tenant "$${AZURE_TENANT_ID}" --resource "$${AZURE_RESOURCE_ID}" --query accessToken --output tsv)

	ext_file="vss-extension-dev.json" && \

	cp "$${ext_file}.template" "$${ext_file}"

	jq 'del(.baseUri)' "$${ext_file}" > "$${ext_file}.tmp" && mv "$${ext_file}.tmp" "$${ext_file}"

	jq '.id = "team-retrospectives-dev" | .publisher = "enginpolat" | .public = false' "$${ext_file}" > "$${ext_file}.tmp" && mv "$${ext_file}.tmp" "$${ext_file}"

	ext_info=$$(npx tfx extension show --no-prompt --json --publisher "enginpolat" --extensionId "team-retrospectives-dev" --token "$${AZURE_DEVOPS_TOKEN}")

	if [[ "$${ext_info}" != "null" ]]; then
		version=$$(jq -r '.versions[0].version' <<< "$${ext_info}")
		jq --arg version "$${version}" '.version = $$version' "$${ext_file}" > "$${ext_file}.tmp" && mv "$${ext_file}.tmp" "$${ext_file}"
	fi

	jq '.contributions[0].properties.name = "Retrospectives (Dev)"' "$${ext_file}" > "$${ext_file}.tmp" && mv "$${ext_file}.tmp" "$${ext_file}"

	cp ../../LICENSE ./assets/LICENSE.md

	popd

publish: prepare
	set -euo pipefail

	pushd src/frontend

	npm run pack:d

	npx tfx extension publish --manifests "$${ext_file}" --vsix ./dist/*.vsix --token "$${AZURE_DEVOPS_TOKEN}" --no-wait-validation

	popd
