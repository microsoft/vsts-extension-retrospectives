#!/usr/bin/env bash
##
## This script deletes all resources
## Usage: ./cleanup.sh
## Example: ./cleanup.sh
##
(
    # Configure environment variables
    if [ -f .env ]
    then
        set -o allexport; source .env; set +o allexport
    fi

    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    # Set service principal information
    subscription_id="${SUBSCRIPTION_ID}"
    tenant_id="${TENANT_ID}"
    service_principal_id="${SERVICE_PRINCIPAL_ID}"
    service_principal_secret="${SERVICE_PRINCIPAL_SECRET}"

    # Set resource variables
    resource_group="rg-${RESOURCE_NAME_SUFFIX}"

    # Login to Azure via Service Principal
    echo "#### Attempting az login via service principal ####"
    az login \
        --service-principal \
        --username="$service_principal_id" \
        --password="$service_principal_secret" \
        --tenant="$tenant_id" >/dev/null

    az account set -s "$subscription_id"
    echo "#### az login done ####"

    # Delete resource group
    echo "#### Deleting resource group: ${resource_group} ####"
    az group delete \
        --name "$resource_group"
)