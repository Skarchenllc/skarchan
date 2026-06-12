'use client';

// Dashboard / Users / Roles / Notifications / Settings now live in the
// AppShell top bar — no separate layout chrome needed here.

export default function NexacoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
