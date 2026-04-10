import type { ReactNode } from 'react';

export function Card({
  title,
  subTitle,
  className,
  children
}: {
  title?: string;
  subTitle?: string;
  className?: string;
  children?: ReactNode;
}) {
  const classes = ['p-card', 'p-component', className].filter(Boolean).join(' ');
  return (
    <div className={classes}>
      <div className="p-card-body">
        {title && <div className="p-card-title">{title}</div>}
        {subTitle && <div className="p-card-subtitle">{subTitle}</div>}
        <div className="p-card-content">{children}</div>
      </div>
    </div>
  );
}
