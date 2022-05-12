#!/usr/bin/env bash
##
## This script adds the extension's dev certificate to the DeveloperOverrideCertificates
## configuration of the backend service.
##
(
    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    # Input parameters
    tenant_id=$1
    service_principal_id=$2
    service_principal_secret=$3
    resource_group=$4
    webapp=$5
    cert=$6

    # az login via service principal
    az login \
        --service-principal \
        --username="$service_principal_id" \
        --password="$service_principal_secret" \
        --tenant="$tenant_id" >/dev/null

    # Query all DeveloperOverrideCertificates values
    certs=$(az webapp config appsettings list \
        --resource-group "$resource_group" \
        --name "$webapp" \
        --query "[].{name: name, value: value}[?contains(name, 'DeveloperOverrideCertificates:')]")

    # Check if the input certificate exists
    if [[ $certs == *$cert* ]]; then
        echo "The input certificate already exists in the app settings"
        exit 0
    fi

    # Find the next index
    id=0
    if [[ $certs != '[]' ]]; then
        # Query all DeveloperOverrideCertificates names
        cert_ids=$(az webapp config appsettings list \
            --resource-group "$resource_group" \
            --name "$webapp" \
            --query "[].{name: name}[?contains(name, 'DeveloperOverrideCertificates:')]" \
            --output table)

        # Remove meta data
        cert_ids="${cert_ids##*$'-\n'}"

        # Find the greatest index
        while read p; do
            cur_id="${p##*$':'}"
            if [[ $cur_id -gt $id ]]; then
                id=$cur_id
            fi
        done <<< "$cert_ids"

        # Increase the index
        id="$((id + 1))"
    fi

    echo "Cert index: $id"
    az webapp config appsettings set \
        --resource-group "$resource_group" \
        --name "$webapp" \
        --settings "DeveloperOverrideCertificates:$id=$cert" \
        > /dev/null
)
