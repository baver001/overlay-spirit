import * as React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<SVGSVGElement> {
  size?: number;
}

export const Spinner = React.forwardRef<SVGSVGElement, SpinnerProps>(
  ({ className, size = 24, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn('animate-spin text-current', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" />
      <path className="opacity-75" d="M22 12a10 10 0 0 1-10 10" />
    </svg>
  )
);

Spinner.displayName = 'Spinner';
