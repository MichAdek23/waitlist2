import { supabase } from './delivaClient';
import type { LegalDocumentData, LegalSectionItem } from '../types';

function normalizeSections(rawSections: any): LegalSectionItem[] {
  if (typeof rawSections === 'string') {
    try {
      const parsed = JSON.parse(rawSections);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return [];
    }
  }
  if (Array.isArray(rawSections)) {
    return rawSections.map((sec: any, idx: number) => ({
      id: String(sec.id || `section-${idx + 1}`),
      number: String(sec.number ?? idx + 1),
      title: String(sec.title || ''),
      content: String(sec.content || ''),
    }));
  }
  return [];
}

function mapRowToLegalDoc(row: any, slug: 'terms' | 'privacy'): LegalDocumentData {
  return {
    slug,
    title: row.title || '',
    documentTitle: row.document_title || row.documentTitle || '',
    version: row.version || '',
    updated_at: row.updated_at || '',
    introductionTitle: row.introduction_title || row.introductionTitle || 'INTRODUCTION',
    introduction: row.introduction || '',
    sections: normalizeSections(row.sections),
  };
}

export async function getLegalDocument(
  slug: 'terms' | 'privacy'
): Promise<LegalDocumentData | null> {
  const { data, error } = await supabase
    .from('legal_documents')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return mapRowToLegalDoc(data, slug);
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
            onUpdate(mapRowToLegalDoc(payload.new, slug));
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
  if (!isoDate) return '';
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
