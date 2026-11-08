import React from 'react';

interface LegalContentRendererProps {
  text: string;
  onNavigate: (path: string) => void;
  formattedUpdatedAt?: string;
}

const CONTACT_PREFIXES = [
  'Company:',
  'Email:',
  'Privacy Contact Email:',
  'Support Email:',
  'Website:',
  'Business Address:',
  'Registered Business Address:',
  'Phone No:',
  'Phone Number:',
];

const VERSION_PREFIXES = [
  'Document Title:',
  'Version:',
  'Last Updated:',
];

export const LegalContentRenderer: React.FC<LegalContentRendererProps> = ({
  text,
  onNavigate,
  formattedUpdatedAt,
}) => {
  const renderInlineTokens = (line: string): React.ReactNode => {
    const tokenRegex =
      /(support@delivaglobe\.com|privacy@delivaglobe\.com|www\.delivaglobe\.com|\+2347015548163|Privacy Policy|Terms and Conditions)/g;

    const parts = line.split(tokenRegex);
    return parts.map((part, idx) => {
      if (part === 'support@delivaglobe.com' || part === 'privacy@delivaglobe.com') {
        return (
          <a key={idx} href={`mailto:${part}`} className="dg-inline-link">
            {part}
          </a>
        );
      }
      if (part === 'www.delivaglobe.com') {
        return (
          <a
            key={idx}
            href="https://www.delivaglobe.com"
            target="_blank"
            rel="noreferrer"
            className="dg-inline-link"
          >
            {part}
          </a>
        );
      }
      if (part === '+2347015548163') {
        return (
          <a key={idx} href="tel:+2347015548163" className="dg-inline-link">
            {part}
          </a>
        );
      }
      if (part === 'Privacy Policy') {
        return (
          <button
            key={idx}
            type="button"
            className="dg-inline-link"
            onClick={() => onNavigate('/privacy-policy')}
          >
            Privacy Policy
          </button>
        );
      }
      if (part === 'Terms and Conditions') {
        return (
          <button
            key={idx}
            type="button"
            className="dg-inline-link"
            onClick={() => onNavigate('/terms')}
          >
            Terms and Conditions
          </button>
        );
      }
      return <React.Fragment key={idx}>{part}</React.Fragment>;
    });
  };

  const renderLineContent = (line: string): React.ReactNode => {
    if (line === 'Welcome to DELIVA.') {
      return <strong>{line}</strong>;
    }

    // Check for numbered clause prefix like "1.1. " or "16.7. "
    const clauseMatch = line.match(/^(\d+\.\d+\.)\s+(.*)$/);
    if (clauseMatch) {
      return (
        <>
          <strong>{clauseMatch[1]}</strong> {renderInlineTokens(clauseMatch[2])}
        </>
      );
    }

    // Check for label prefixes like "Email: ..." or "Document Title: ..."
    for (const prefix of [...CONTACT_PREFIXES, ...VERSION_PREFIXES]) {
      if (line.startsWith(prefix)) {
        const rest = line.slice(prefix.length).trim();
        if (prefix === 'Last Updated:' && formattedUpdatedAt) {
          return (
            <>
              <strong>{prefix}</strong> {formattedUpdatedAt}
            </>
          );
        }
        return (
          <>
            <strong>{prefix}</strong> {renderInlineTokens(rest)}
          </>
        );
      }
    }

    return renderInlineTokens(line);
  };

  const rawLines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < rawLines.length) {
    const line = rawLines[i];

    // 1. Subheading starting with "### "
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={`sub-${i}`} className="dg-legal-subheading">
          {line.slice(4).trim()}
        </h3>
      );
      i++;
      continue;
    }

    // 2. Group consecutive bullet items starting with "•" or "- "
    if (line.startsWith('•') || line.startsWith('- ')) {
      const bullets: string[] = [];
      const startIdx = i;
      while (
        i < rawLines.length &&
        (rawLines[i].startsWith('•') || rawLines[i].startsWith('- '))
      ) {
        bullets.push(rawLines[i].replace(/^(•|-)\s*/, '').trim());
        i++;
      }
      elements.push(
        <ul key={`list-${startIdx}`} className="dg-legal-list">
          {bullets.map((b, bIdx) => (
            <li key={bIdx}>{renderInlineTokens(b)}</li>
          ))}
        </ul>
      );
      continue;
    }

    // 3. Group consecutive Contact lines into a styled contact card
    if (CONTACT_PREFIXES.some((prefix) => line.startsWith(prefix))) {
      const contactLines: string[] = [];
      const startIdx = i;
      while (
        i < rawLines.length &&
        CONTACT_PREFIXES.some((prefix) => rawLines[i].startsWith(prefix))
      ) {
        contactLines.push(rawLines[i]);
        i++;
      }
      elements.push(
        <div key={`contact-${startIdx}`} className="dg-legal-contact-card">
          {contactLines.map((cLine, cIdx) => (
            <p key={cIdx}>{renderLineContent(cLine)}</p>
          ))}
        </div>
      );
      continue;
    }

    // 4. Motto line
    if (
      line === 'DELIVA — Beyond delivery' ||
      line === 'DELIVA GLOBE LTD Beyond Delivery'
    ) {
      elements.push(
        <p key={`motto-${i}`} className="dg-legal-motto">
          {line}
        </p>
      );
      i++;
      continue;
    }

    // 5. Standard paragraph
    elements.push(<p key={`p-${i}`}>{renderLineContent(line)}</p>);
    i++;
  }

  return <>{elements}</>;
};

