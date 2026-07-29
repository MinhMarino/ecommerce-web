import { api } from "./api";

export type SiteSettings = Record<string, string>;

let cached: SiteSettings | null = null;
let inflight: Promise<SiteSettings> | null = null;

/** Site settings rarely change — fetch /home once per session and reuse across static pages. */
export function useSiteSettingsLoader() {
  return async (): Promise<SiteSettings> => {
    if (cached) return cached;
    if (!inflight) {
      inflight = api<{ settings: SiteSettings }>("/api/v1/home", { auth: false })
        .then((d) => {
          cached = d.settings;
          return cached;
        })
        .finally(() => {
          inflight = null;
        });
    }
    return inflight;
  };
}
