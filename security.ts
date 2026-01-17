
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

/**
 * Securely stores the API key in the browser's session storage.
 * This is safer than localStorage as it's cleared when the tab is closed.
 */
export const storeApiKey = (key: string) => {
    sessionStorage.setItem('sentinel_vault_key', btoa(key)); // Simple obfuscation
};

/**
 * Retrieves the API key from session storage or environment variables.
 */
export const getApiKey = (): string | null => {
    const vaulted = sessionStorage.getItem('sentinel_vault_key');
    if (vaulted) return atob(vaulted);
    
    // Fallback to environment variable for development
    return import.meta.env.VITE_API_KEY || null;
};

/**
 * Clears all sensitive data from the session.
 */
export const purgeVault = () => {
    sessionStorage.removeItem('sentinel_vault_key');
};
