import React, { useState, useEffect } from 'react';
import { getCountdownTarget, subscribeToCountdownTarget } from '../lib/delivaClient';

interface HeaderProps {
  onNavigate?: (path: string) => void;
  hideTimer?: boolean;
  isPortal?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onNavigate,
  hideTimer = false,
  isPortal = false,
}) => {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    if (hideTimer) return;
    getCountdownTarget().then(setTargetDate);
    return subscribeToCountdownTarget(setTargetDate);
  }, [hideTimer]);

  useEffect(() => {
    if (hideTimer || !targetDate) return;
    const tick = () => {
      const diff = Math.max(0, targetDate.getTime() - Date.now());
      setLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [hideTimer, targetDate]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <header className={`dg-header${isPortal ? ' dg-header-portal' : ''}`}>
      <div className="dg-header-inner">
        {isPortal ? (
          <div className="dg-header-portal-brand" aria-label="Deliva Drivers Portal">
            <span role="img" aria-label="Deliva" className="dg-logo-mark dg-header-logo" />
          </div>
        ) : (
          <a
            href="/"
            aria-label="Deliva home"
            onClick={(e) => {
              if (onNavigate) {
                e.preventDefault();
                onNavigate('/');
              }
            }}
          >
            <span role="img" aria-label="Deliva" className="dg-logo-mark dg-header-logo" />
          </a>
        )}
        {!hideTimer && (
          <div className="dg-header-nav">
            <button
              type="button"
              className="dg-header-nav-link"
              onClick={() => onNavigate && onNavigate('/help')}
            >
              Help
            </button>
            <button
              type="button"
              className="dg-header-nav-link"
              onClick={() => onNavigate && onNavigate('/contact')}
            >
              Contact
            </button>
            <span className="dg-header-time" aria-label="Time until launch">
              {pad(left.d)}d {pad(left.h)}h {pad(left.m)}m {pad(left.s)}s
            </span>
          </div>
        )}
        {hideTimer && !isPortal && (
          <div className="dg-header-nav">
            <button
              type="button"
              className="dg-header-nav-link"
              onClick={() => onNavigate && onNavigate('/help')}
            >
              Help
            </button>
            <button
              type="button"
              className="dg-header-nav-link"
              onClick={() => onNavigate && onNavigate('/contact')}
            >
              Contact
            </button>
          </div>
        )}
        {isPortal && (
          <span className="dg-header-portal-label">Drivers Portal</span>
        )}
      </div>
    </header>
  );
};
