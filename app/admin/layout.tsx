import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin Portal — GDG × UPES Event Management',
  description: 'Event registration administration, live analytics, and participant management',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#F4EFE7] text-[#21172E] font-sans antialiased">
      {children}
    </div>
  );
}

