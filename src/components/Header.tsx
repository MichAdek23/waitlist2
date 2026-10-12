import React, { useState, useEffect } from 'react';
import { getCountdownTarget, subscribeToCountdownTarget } from '../lib/supabase';

export const Header: React.FC = () => {
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [left, setLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    getCountdownTarget().then(setTargetDate);
    return subscribeToCountdownTarget(setTargetDate);
  }, []);

  useEffect(() => {
    if (!targetDate) return;
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
  }, [targetDate]);

  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <header className="dg-header">
      <div className="dg-header-inner">
        <a href="/" aria-label="Deliva home">
          <span role="img" aria-label="Deliva" className="dg-logo-mark dg-header-logo" />
        </a>
        <span className="dg-header-time" aria-label="Time until launch">
          {pad(left.d)}d {pad(left.h)}h {pad(left.m)}m {pad(left.s)}s
        </span>
      </div>
    </header>
  );
};
