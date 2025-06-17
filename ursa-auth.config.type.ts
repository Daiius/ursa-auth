/**
 * type of UrsaAuth configurations.
 * NOTE your configuration using this type definition MUST BE SECRET!!
 */
export type UrsaAuthConfig = UrsaAuthServerConfig & UrsaAuthClientConfig

export type UrsaAuthServerConfig = {
  /** Host url (from external server) */
  host: string;
  /** 
   * URL patterns for allowed web redirect URL (checked by startsWith()),
   *  usually your application URL and UrsaAuth URL for mobile redirection.
   */
  allowedRedirectPatterns: string[];
  /**
   * URL patterns for allowed mobile redirect URL (checked by startsWith())
   */
  allowedMobileRedirectPatterns: string[];
  /** GitHub OAuth Secrets */
  github?: {
    clientId: string;
    clientSecret: string;
  },
}

export type UrsaAuthClientConfig = {
  /** Auth.js secret (string[] for key rotation) */
  authSecrets: string[];
}

