import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GDG × UPES — Event Registration & Analytics',
  description: 'Official Campus Event Registration for Google Developer Groups at UPES Dehradun',
  icons: {
    icon: '/logos/gdg-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Manrope:wght@300..800&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans bg-[#F4EFE7] text-[#21172E] antialiased">
        {children}
      </body>
    </html>
  );
}
