#!/usr/bin/env bash
##
## This script creates the Retrospective Extension backend dev environment infrastructure
## Usage: ./env_setup.sh
## Example: ./env_setup.sh
##
## Resources include:
## - Resource group
## - SignalR service
## - Azure Web App
##

(
    # Configure environment variables
    if [ -f .env ]
    then
        set -o allexport; source .env; set +o allexport
    fi

    cd "$(dirname "$0")/.." || exit
    set -euo pipefail

    # Set Resource(s) suffix and location
    resource_name_suffix="${RESOURCE_NAME_SUFFIX}"
    resource_group="rg-${RESOURCE_NAME_SUFFIX}"
    location="${LOCATION}"
    
    # Login to Azure via Service Principal

    # Set service principal information
    echo "#### Exporting SP as environment variables ####"
    subscription_id="${SUBSCRIPTION_ID}"
    tenant_id="${TENANT_ID}"
    service_principal_id="${SERVICE_PRINCIPAL_ID}"
    service_principal_secret="${SERVICE_PRINCIPAL_SECRET}"
    echo "#### Attempting az login via service principal ####"
    az login \
        --service-principal \
        --username="$service_principal_id" \
        --password="$service_principal_secret" \
        --tenant="$tenant_id" >/dev/null

    az account set -s "$subscription_id"
    echo "#### az login done ####"

    # Create resource group
    echo "#### Creating resource resource group - $resource_group ####"
    az group create \
        --name "$resource_group" \
        --location "$location"

    # https://docs.microsoft.com/en-us/cli/azure/signalr?view=azure-cli-latest#az-signalr-create
    # Create SignalR service
    echo "#### Creating SignalR service ####"
    az signalr create \
        --name "sigr-${resource_name_suffix}" \
        --resource-group "$resource_group" \
        --sku Standard_S1

    # https://docs.microsoft.com/en-us/cli/azure/appservice/plan?view=azure-cli-latest
    # Create AppService plan
    az appservice plan create \
        --name "plan-${resource_name_suffix}" \
        --resource-group "$resource_group"
    
    # https://docs.azure.cn/en-us/cli/webapp?view=azure-cli-latest#az_webapp_create
    # Create WebApp
    az webapp create \
        --name "app-${resource_name_suffix}" \
        --resource-group "$resource_group" \
        --plan "plan-${resource_name_suffix}"\
        --runtime "DOTNET|5.0"

    signalr_connection_string=$( \
        az signalr key list \
            --name "sigr-${resource_name_suffix}" \
            --resource-group "$resource_group" \
            --query primaryConnectionString \
            --output tsv)

    echo "#### Deploying App Settings ####"
    # https://docs.microsoft.com/en-us/cli/azure/webapp/config/appsettings?view=azure-cli-latest#az-webapp-config-appsettings-set
    # Create WebApp AppSettings
    az webapp config appsettings set \
        --resource-group "$resource_group" \
        --name "app-${resource_name_suffix}" \
        --settings Azure__SignalR__ConnectionString=$signalr_connection_string "@dev_certs.json" "@allowed_origins.json"

    #Create Output directory to publish the dotnet project artifacts to be published to the Azure Web Apps Instance

    echo "#### Publishing backend project ####"

    dotnet build
    # Publish the Dotnet project
    dotnet publish -c Release 

    cd  bin/Release/net5/publish/
    # Zip the deployed artifact
    zip -r "../../../website.zip" .

    cd ../../../..
   
    # https://docs.microsoft.com/en-us/cli/azure/webapp?view=azure-cli-latest#az-webapp-deploy
    # Deploy the web app
    az webapp deploy --resource-group "$resource_group" \
        --name "app-${resource_name_suffix}" --src-path "bin/website.zip"

    backend_service_url=$( az webapp show  \
        --resource-group "$resource_group" \
        --name "app-${resource_name_suffix}" \
        --query defaultHostName --output tsv)

    backend_health_check="https://${backend_service_url}/health"
   
    echo "Backend service successfully deployed at ${backend_service_url}. To check the health of the deployment visit ${backend_health_check}"
)