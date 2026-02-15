type MetaSpec = {
  selector: string;
  attr: 'name' | 'property';
  key: string;
  content: string;
};

export type PageSeoConfig = {
  title: string;
  canonicalUrl: string;
  metas: MetaSpec[];
};

function restoreAttribute(element: Element, attr: string, value: string | null) {
  if (value === null) {
    element.removeAttribute(attr);
    return;
  }
  element.setAttribute(attr, value);
}

export function applyPageSeo(config: PageSeoConfig): () => void {
  const previousTitle = document.title;
  document.title = config.title;

  const cleanupFns: Array<() => void> = [];

  for (const meta of config.metas) {
    let element = document.head.querySelector<HTMLMetaElement>(meta.selector);
    const created = !element;
    if (!element) {
      element = document.createElement('meta');
      document.head.appendChild(element);
    }

    const previousKey = element.getAttribute(meta.attr);
    const previousContent = element.getAttribute('content');

    element.setAttribute(meta.attr, meta.key);
    element.setAttribute('content', meta.content);

    cleanupFns.push(() => {
      if (created) {
        element?.remove();
        return;
      }
      restoreAttribute(element, meta.attr, previousKey);
      restoreAttribute(element, 'content', previousContent);
    });
  }

  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const canonicalCreated = !canonical;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }

  const previousCanonicalHref = canonical.getAttribute('href');
  canonical.setAttribute('href', config.canonicalUrl);

  cleanupFns.push(() => {
    if (canonicalCreated) {
      canonical?.remove();
      return;
    }
    restoreAttribute(canonical, 'href', previousCanonicalHref);
  });

  return () => {
    document.title = previousTitle;
    cleanupFns.reverse().forEach((cleanupFn) => cleanupFn());
  };
}
