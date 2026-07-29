import { useEffect, useRef, useState, type RefObject } from "react";
import { api } from "./api";

/** Debounce a fast-changing value (e.g. a search input) by `delay` ms. */
export function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export type SearchSuggestion = { type: string; id: string; name: string; slug: string };

/** Shared autocomplete fetcher used by the header search box and the catalog page. */
export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const debounced = useDebouncedValue(query.trim(), 250);
  const requestId = useRef(0);

  useEffect(() => {
    if (!debounced) {
      setSuggestions([]);
      return;
    }
    const id = ++requestId.current;
    api<{ suggestions: SearchSuggestion[] }>(
      `/api/v1/search/suggest?q=${encodeURIComponent(debounced)}`,
      { auth: false },
    )
      .then((d) => {
        if (id === requestId.current) setSuggestions(d.suggestions || []);
      })
      .catch(() => {
        if (id === requestId.current) setSuggestions([]);
      });
  }, [debounced]);

  return suggestions;
}

/** Detect clicks outside a set of refs, useful for closing dropdowns/menus. */
export function useOnClickOutside(
  refs: Array<RefObject<HTMLElement | null>>,
  handler: () => void,
) {
  useEffect(() => {
    function listener(event: MouseEvent) {
      const target = event.target as Node;
      if (refs.some((ref) => ref.current?.contains(target))) return;
      handler();
    }
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [refs, handler]);
}

/** Lock body scroll while a drawer/modal is open. */
export function useLockBodyScroll(locked: boolean) {
  useEffect(() => {
    if (!locked) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}
