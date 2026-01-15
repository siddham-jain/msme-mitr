/**
 * Live Region Components for Screen Reader Accessibility
 * Requirements: 12.6
 * 
 * These components provide ARIA live regions for announcing dynamic content
 * changes to screen reader users.
 */

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * LiveRegion - Base component for ARIA live regions
 * 
 * @param role - ARIA role (status, alert, log)
 * @param ariaLive - Politeness level (polite, assertive, off)
 * @param ariaAtomic - Whether to announce entire region or just changes
 */
interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: 'status' | 'alert' | 'log';
  ariaLive?: 'polite' | 'assertive' | 'off';
  ariaAtomic?: boolean;
  visuallyHidden?: boolean;
}

export function LiveRegion({
  role = 'status',
  ariaLive = 'polite',
  ariaAtomic = true,
  visuallyHidden = false,
  className,
  children,
  ...props
}: LiveRegionProps) {
  return (
    <div
      role={role}
      aria-live={ariaLive}
      aria-atomic={ariaAtomic}
      className={cn(
        visuallyHidden && 'sr-only',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * StatusMessage - For non-urgent status updates
 * Examples: "Message sent", "File uploaded", "Settings saved"
 */
interface StatusMessageProps extends Omit<LiveRegionProps, 'role' | 'ariaLive'> {
  message?: string;
}

export function StatusMessage({
  message,
  visuallyHidden = true,
  children,
  ...props
}: StatusMessageProps) {
  return (
    <LiveRegion
      role="status"
      ariaLive="polite"
      visuallyHidden={visuallyHidden}
      {...props}
    >
      {message || children}
    </LiveRegion>
  );
}

/**
 * AlertMessage - For important, time-sensitive information
 * Examples: "Error occurred", "Connection lost", "Form validation failed"
 */
interface AlertMessageProps extends Omit<LiveRegionProps, 'role' | 'ariaLive'> {
  message?: string;
}

export function AlertMessage({
  message,
  visuallyHidden = false,
  children,
  ...props
}: AlertMessageProps) {
  return (
    <LiveRegion
      role="alert"
      ariaLive="assertive"
      visuallyHidden={visuallyHidden}
      {...props}
    >
      {message || children}
    </LiveRegion>
  );
}

/**
 * LogRegion - For sequential updates (like chat messages)
 * Examples: Chat messages, activity feeds, notifications
 */
interface LogRegionProps extends Omit<LiveRegionProps, 'role' | 'ariaLive'> {
  label?: string;
}

export function LogRegion({
  label = 'Activity log',
  visuallyHidden = false,
  children,
  ...props
}: LogRegionProps) {
  return (
    <LiveRegion
      role="log"
      ariaLive="polite"
      ariaAtomic={false}
      aria-label={label}
      visuallyHidden={visuallyHidden}
      {...props}
    >
      {children}
    </LiveRegion>
  );
}

/**
 * LoadingAnnouncement - Announces loading states to screen readers
 */
interface LoadingAnnouncementProps {
  isLoading: boolean;
  loadingMessage?: string;
  completeMessage?: string;
}

export function LoadingAnnouncement({
  isLoading,
  loadingMessage = 'Loading...',
  completeMessage = 'Content loaded',
}: LoadingAnnouncementProps) {
  return (
    <StatusMessage>
      {isLoading ? loadingMessage : completeMessage}
    </StatusMessage>
  );
}

/**
 * Hook for managing live region announcements
 * 
 * Usage:
 * const announce = useLiveAnnouncement();
 * announce('Message sent successfully');
 */
export function useLiveAnnouncement() {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string) => {
    // Clear first to ensure announcement is made even if message is the same
    setAnnouncement('');
    // Use setTimeout to ensure the DOM updates
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const AnnouncementRegion = React.useMemo(
    () => (
      <StatusMessage message={announcement} />
    ),
    [announcement]
  );

  return { announce, AnnouncementRegion };
}
