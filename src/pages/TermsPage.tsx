import React, { useState, useEffect } from 'react';
import type { LegalDocumentData } from '../types';
import {
  getLegalDocument,
  subscribeToLegalDocument,
  formatLegalTimestamp,
} from '../lib/legalService';
import { LegalContentRenderer } from '../components/LegalContentRenderer';

interface TermsPageProps {
  onNavigate: (path: string) => void;
}

export const TermsPage: React.FC<TermsPageProps> = ({ onNavigate }) => {
  const [doc, setDoc] = useState<LegalDocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getLegalDocument('terms')
      .then((data) => {
        setDoc(data);
      })
      .finally(() => {
        setLoading(false);
      });

    return subscribeToLegalDocument('terms', (updated) => {
      setDoc(updated);
    });
  }, []);

  if (loading) {
    return (
      <main className="dg-legal-page">
        <section className="dg-legal-hero">
          <div className="dg-legal-hero-inner">
            <h1 className="dg-legal-main-title">Terms &amp; Conditions</h1>
          </div>
        </section>
        <div className="dg-legal-container">
          <article className="dg-legal-article">
            <p className="dg-legal-section-body">Loading Terms &amp; Conditions...</p>
          </article>
        </div>
      </main>
    );
  }

  if (!doc) {
    return (
      <main className="dg-legal-page">
        <section className="dg-legal-hero">
          <div className="dg-legal-hero-inner">
            <h1 className="dg-legal-main-title">Terms &amp; Conditions</h1>
          </div>
        </section>
        <div className="dg-legal-container">
          <article className="dg-legal-article">
            <p className="dg-legal-section-body">
              Terms &amp; Conditions document is not available yet.
            </p>
          </article>
        </div>
      </main>
    );
  }

  const formattedTimestamp = formatLegalTimestamp(doc.updated_at);

  return (
    <main className="dg-legal-page">
      {/* Page Banner */}
      <section className="dg-legal-hero">
        <div className="dg-legal-hero-inner">
          <h1 className="dg-legal-main-title">{doc.title}</h1>
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="dg-legal-container">
        <div className="dg-legal-layout">
          {/* Sticky Sidebar Table of Contents */}
          <aside className="dg-legal-sidebar" aria-label="Table of contents">
            <div className="dg-legal-toc-card">
              <h2 className="dg-legal-toc-title">Table of Contents</h2>
              <nav className="dg-legal-toc-nav">
                <a href="#introduction" className="dg-legal-toc-link">
                  {doc.introductionTitle || 'Introduction'}
                </a>
                {doc.sections.map((sec) => (
                  <a
                    key={sec.id}
                    href={`#${sec.id}`}
                    className="dg-legal-toc-link"
                  >
                    {sec.number}. {sec.title}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          {/* Document Body */}
          <article className="dg-legal-article">
            {/* Database Last Updated Timestamp Bar */}
            {formattedTimestamp && (
              <div className="dg-legal-updated-bar">
                <span className="dg-legal-updated-dot" aria-hidden="true" />
                <span>
                  Last edited &amp; updated: <strong>{formattedTimestamp}</strong>
                </span>
                {doc.version && (
                  <span className="dg-legal-updated-ver">Version {doc.version}</span>
                )}
              </div>
            )}

            {/* Introduction */}
            <section id="introduction" className="dg-legal-section dg-legal-intro-card">
              <h2 className="dg-legal-section-heading">
                {doc.introductionTitle || 'INTRODUCTION'}
              </h2>
              <div className="dg-legal-section-body">
                <LegalContentRenderer
                  text={doc.introduction}
                  onNavigate={onNavigate}
                  formattedUpdatedAt={formattedTimestamp}
                />
              </div>
            </section>

            {/* Dynamic Database Sections */}
            {doc.sections.map((sec) => {
              const isVersionBox =
                sec.id === 'version-control' || sec.id === 'final-note';
              return (
                <section key={sec.id} id={sec.id} className="dg-legal-section">
                  <h2 className="dg-legal-section-heading">
                    <span className="dg-legal-sec-num">{sec.number}.</span> {sec.title}
                  </h2>
                  <div
                    className={
                      isVersionBox
                        ? 'dg-legal-section-body dg-legal-version-box'
                        : 'dg-legal-section-body'
                    }
                  >
                    <LegalContentRenderer
                      text={sec.content}
                      onNavigate={onNavigate}
                      formattedUpdatedAt={formattedTimestamp}
                    />
                  </div>
                </section>
              );
            })}
          </article>
        </div>
      </div>
    </main>
  );
};
