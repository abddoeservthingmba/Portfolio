import { useEffect } from 'react';

export interface DocumentMeta {
  title: string;
  description: string;
  /** Absolute URL of a preview image, when the record carries one. */
  image?: string | null;
}

const SITE_NAME = 'Portfolio';

/**
 * Sets the title, description and Open Graph tags for the current route (O3,
 * FR-01..FR-09), injected from the fetched record so a shared link previews
 * correctly (C3).
 *
 * This is a client-rendered site, so a crawler that does not execute JavaScript
 * sees only the tags in index.html. That is a known consequence of the
 * rendering-model decision in A8 and the reason those defaults are meaningful
 * rather than placeholders.
 */
export function useDocumentMeta({ title, description, image }: DocumentMeta): void {
  useEffect(() => {
    const fullTitle = title === SITE_NAME ? SITE_NAME : `${title} · ${SITE_NAME}`;
    document.title = fullTitle;

    setMetaByName('description', description);
    setMetaByProperty('og:title', fullTitle);
    setMetaByProperty('og:description', description);
    setMetaByProperty('og:type', 'website');
    setMetaByProperty('og:url', window.location.href);

    if (image) {
      setMetaByProperty('og:image', image);
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
    }
  }, [title, description, image]);
}

function setMetaByName(name: string, content: string) {
  upsert(`meta[name="${name}"]`, () => {
    const tag = document.createElement('meta');
    tag.setAttribute('name', name);
    return tag;
  }).setAttribute('content', content);
}

function setMetaByProperty(property: string, content: string) {
  upsert(`meta[property="${property}"]`, () => {
    const tag = document.createElement('meta');
    tag.setAttribute('property', property);
    return tag;
  }).setAttribute('content', content);
}

function upsert(selector: string, create: () => HTMLMetaElement): HTMLMetaElement {
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (existing) return existing;

  const created = create();
  document.head.appendChild(created);
  return created;
}
