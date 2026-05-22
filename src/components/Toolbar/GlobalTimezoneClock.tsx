import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function GlobalTimezoneClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    // Update every 60 seconds since we only show hours/minutes
    const interval = setInterval(() => {
      setNow(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (timeZone: string) => {
    return new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(now);
  };

  return (
    <div className="flex items-center gap-2 mx-2 text-[11px] font-semibold text-text-primary tracking-wide">
      <div className="flex items-center justify-center p-2 bg-surface-raised border border-divider shadow-sm rounded-lg hover:shadow-md transition-all">
        <Clock size={12} className="text-text-muted mr-1.5" />
        <span className="text-text-muted mr-1">EST</span>
        <span>{formatTime('America/New_York')}</span>
      </div>
      <div className="flex items-center justify-center p-2 bg-surface-raised border border-divider shadow-sm rounded-lg hover:shadow-md transition-all">
        <span className="text-text-muted mr-1">CST</span>
        <span>{formatTime('America/Chicago')}</span>
      </div>
      <div className="flex items-center justify-center p-2 bg-surface-raised border border-divider shadow-sm rounded-lg hover:shadow-md transition-all">
        <span className="text-text-muted mr-1">MST</span>
        <span>{formatTime('America/Denver')}</span>
      </div>
      <div className="flex items-center justify-center p-2 bg-surface-raised border border-divider shadow-sm rounded-lg hover:shadow-md transition-all">
        <span className="text-text-muted mr-1">PST</span>
        <span>{formatTime('America/Los_Angeles')}</span>
      </div>
    </div>
  );
}
