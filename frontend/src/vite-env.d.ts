/// <reference types="vite/client" />

interface ImportMetaEnv {
  /**
   * Base da API. Fixada no build: em produção vale "/api/" (mesmo domínio do
   * frontend); vazia em desenvolvimento, onde o axios cai no padrão local.
   */
  readonly VITE_API_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
