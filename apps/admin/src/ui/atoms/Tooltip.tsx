import type { ReactNode } from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

export function Tooltip({
  content,
  position = 'top',
  children
}: {
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: ReactNode;
}) {
  const side = position === 'left' ? 'left' : position === 'right' ? 'right' : position === 'bottom' ? 'bottom' : 'top';

  return (
    <TooltipPrimitive.Provider delayDuration={300}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {/* Radix requires a single focusable child */}
          <span style={{ display: 'contents' }}>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            className="p-tooltip p-component p-tooltip-top"
            sideOffset={4}
          >
            <div className="p-tooltip-text">{content}</div>
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
