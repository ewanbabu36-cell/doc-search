import React from 'react';
import { DocSearchLogo } from '@docsearch/ui-kit';

export interface DocSearchResponsiveBrandProps {
  workspaceName?: string;
  workspaceColor?: string;
  workspaceIcon?: string;
  isCompact?: boolean;
  onClick?: () => void;
  className?: string;
}

export const DocSearchResponsiveBrand: React.FC<DocSearchResponsiveBrandProps> = ({
  workspaceName = 'Healthcare',
  isCompact = false,
  onClick,
  className = ''
}) => {
  const handleHomeClick = () => {
    if (onClick) {
      onClick();
      return;
    }
    // Default home redirect: go to partner root
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  return (
    <DocSearchLogo
      variant={isCompact ? 'compact' : 'full'}
      size="sm"
      badgeText={workspaceName.replace(/_/g, ' ').toUpperCase()}
      redirectUrl="/"
      clickable={true}
      onClick={handleHomeClick}
      className={className}
    />
  );
};
