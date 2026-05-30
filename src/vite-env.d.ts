/// <reference types="vite/client" />

// vite-imagetools 10.x does not ship client-side module declarations, so we
// declare the `?as=picture` shape locally. Only the variants we actually use
// are typed; add more as needed.
declare module '*?as=picture&w=400;800;1200&format=avif;webp;jpg' {
  const value: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default value;
}
declare module '*?as=picture&w=400;800;1200&format=avif;webp;png' {
  const value: {
    sources: Record<string, string>;
    img: { src: string; w: number; h: number };
  };
  export default value;
}

interface ImportMetaEnv {
  readonly VITE_FORM_ENDPOINT?: string;
  readonly VITE_SITE_URL?: string;
  readonly VITE_OLLAMA_ENDPOINT?: string;
  readonly VITE_OLLAMA_MODEL?: string;
  readonly VITE_ANALYTICS_SCRIPT_URL?: string;
  readonly VITE_ANALYTICS_SITE_ID?: string;
  readonly VITE_ANALYTICS_DOMAIN?: string;
  readonly VITE_SOCIAL_GITHUB?: string;
  readonly VITE_SOCIAL_TWITTER?: string;
  readonly VITE_SOCIAL_LINKEDIN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
