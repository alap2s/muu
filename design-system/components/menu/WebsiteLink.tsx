import React from 'react';
import { cn } from '../../utils/cn';

export interface WebsiteLinkProps {
  url: string;
  className?: string;
}

export const WebsiteLink = React.forwardRef<HTMLAnchorElement, WebsiteLinkProps>(
  ({ url, className }, ref) => {
    return (
      <div className={cn('mt-4 text-center', className)}>
        <a
          ref={ref}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-black hover:underline"
        >
          Visit Restaurant Website
        </a>
      </div>
    );
  }
);

WebsiteLink.displayName = 'WebsiteLink'; 