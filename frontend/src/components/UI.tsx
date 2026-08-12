import type { ReactNode, CSSProperties } from 'react';

export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) {
  return (
    <div className={`card ${className}`} style={style}>
      {children}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'green' | 'amber' | 'red' | 'blue' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Empty({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="empty">
      <strong>{title}</strong>
      <span>{copy}</span>
    </div>
  );
}

export function ErrorBox({ message }: { message: string }) {
  return <div className="error">{message}</div>;
}
