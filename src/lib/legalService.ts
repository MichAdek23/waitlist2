import { supabase } from './supabase';
import { DEFAULT_LEGAL_DOCS, type LegalDocumentData, type LegalSectionItem } from '../data/defaultLegalDocs';

const CACHE_PREFIX = 'deliva_waitlist2_legal_doc_';

function normalizeSections(rawSections: any, fallback: LegalSectionItem[]): LegalSectionItem[] {
  if (typeof rawSections === 'string') {
    try {
      const parsed = JSON.parse(rawSections);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return fallback;
    }
  }
  if (Array.isArray(rawSections) && rawSections.length > 0) {
    return rawSections.map((sec: any, idx: number) => ({
      id: String(sec.id || `section-${idx + 1}`),
      number: String(sec.number ?? idx + 1),
      title: String(sec.title || ''),
      content: String(sec.content || ''),
    }));
  }
  return fallback;
}

function mapRowToLegalDoc(row: any, slug: 'terms' | 'privacy'): LegalDocumentData {
  const fallback = DEFAULT_LEGAL_DOCS[slug];
  return {
    slug,
    title: row.title || fallback.title,
    documentTitle: row.document_title || row.documentTitle || fallback.documentTitle,
    version: row.version || fallback.version,
    updated_at: row.updated_at || fallback.updated_at,
    introductionTitle: row.introduction_title || row.introductionTitle || fallback.introductionTitle,
    introduction: row.introduction || fallback.introduction,
    sections: normalizeSections(row.sections, fallback.sections),
  };
}

export async function getLegalDocument(slug: 'terms' | 'privacy'): Promise<LegalDocumentData> {
  const fallback = DEFAULT_LEGAL_DOCS[slug];

  // 1. Try dedicated `legal_documents` table in Supabase
  try {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!error && data) {
      const mapped = mapRowToLegalDoc(data, slug);
      try {
        localStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(mapped));
      } catch {
        // ignore storage quota errors
      }
      return mapped;
    }
  } catch {
    // continue to fallback
  }

  // 2. Try `waitlist_config` table (`key = 'legal_terms'` or `'legal_privacy'`)
  try {
    const { data, error } = await supabase
      .from('waitlist_config')
      .select('value, updated_at')
      .eq('key', `legal_${slug}`)
      .maybeSingle();

    if (!error && data?.value) {
      const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
      const mapped = mapRowToLegalDoc(
        {
          ...parsed,
          updated_at: data.updated_at || parsed.updated_at || fallback.updated_at,
        },
        slug
      );
      try {
        localStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(mapped));
      } catch {
        // ignore
      }
      return mapped;
    }
  } catch {
    // continue to local cache / default
  }

  // 3. Check local cache if offline
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + slug);
    if (cached) {
      const parsed = JSON.parse(cached);
      return mapRowToLegalDoc(parsed, slug);
    }
  } catch {
    // ignore
  }

  return fallback;
}

export function subscribeToLegalDocument(
  slug: 'terms' | 'privacy',
  onUpdate: (doc: LegalDocumentData) => void
): () => void {
  try {
    const channel = supabase
      .channel(`legal_doc_${slug}_channel`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'legal_documents',
          filter: `slug=eq.${slug}`,
        },
        (payload: any) => {
          if (payload?.new) {
            const updated = mapRowToLegalDoc(payload.new, slug);
            try {
              localStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(updated));
            } catch {
              // ignore
            }
            onUpdate(updated);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'waitlist_config',
          filter: `key=eq.legal_${slug}`,
        },
        (payload: any) => {
          if (payload?.new?.value) {
            try {
              const parsed =
                typeof payload.new.value === 'string'
                  ? JSON.parse(payload.new.value)
                  : payload.new.value;
              const updated = mapRowToLegalDoc(
                {
                  ...parsed,
                  updated_at: payload.new.updated_at || parsed.updated_at,
                },
                slug
              );
              localStorage.setItem(CACHE_PREFIX + slug, JSON.stringify(updated));
              onUpdate(updated);
            } catch {
              // ignore
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  } catch {
    return () => {};
  }
}

export function formatLegalTimestamp(isoDate?: string | null): string {
  if (!isoDate) return 'November 2026';
  const date = new Date(isoDate);
  if (isNaN(date.getTime())) return String(isoDate);

  return new Intl.DateTimeFormat('en-NG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

