/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_APP: string
}
interface ImportMeta {
  readonly env: ImportMetaEnv
}
