using Microsoft.Azure.KeyVault.Models;
using Microsoft.Extensions.Configuration.AzureKeyVault;

namespace CollaborationStateService.Configuration
{
    /// <summary>
    /// Extends <see cref="DefaultKeyVaultSecretManager"/> to only load enabled secret items
    /// and replaces '--' with ':" in the names.
    /// </summary>
    public class ReflectKeyVaultSecretManager : DefaultKeyVaultSecretManager
    {
        /// <inheritdoc />
        public override bool Load(SecretItem secret)
        {
            return secret.Attributes.Enabled ?? false;
        }
    }
}
