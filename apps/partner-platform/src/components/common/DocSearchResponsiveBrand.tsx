import React from 'react';
import { DocSearchLogo } from '@docsearch/ui-kit';

export interface DocSearchResponsiveBrandProps {
  workspaceName?: string;
  workspaceColor?: string;
  workspaceIcon?: string;
  subtitle?: string;
  isCompact?: boolean;
  onClick?: () => void;
  className?: string;
}

export const DocSearchResponsiveBrand: React.FC<DocSearchResponsiveBrandProps> = ({
  workspaceName = 'Healthcare',
  subtitle,
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

  const defaultSubtitle =
    workspaceName.toUpperCase() === 'CLINIC'
      ? 'Clinic & OPD Chamber'
      : `${workspaceName.replace(/_/g, ' ')} Intelligence`;

  return (
    <DocSearchLogo
      variant={isCompact ? 'icon-only' : 'full'}
      size="sm"
      badgeText={workspaceName.replace(/_/g, ' ').toUpperCase()}
      subtitle={subtitle || defaultSubtitle}
      redirectUrl="/"
      clickable={true}
      onClick={handleHomeClick}
      className={className}
    />
  );
};
