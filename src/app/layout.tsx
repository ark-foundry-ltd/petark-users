import type { Metadata, Viewport } from "next";
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/notifications/ServiceWorkerRegistration';


export const metadata: Metadata = {
  title: "PetArk",
  description:
    "PetArk is a digital health platform that connects pet owners with vet clinics",
  manifest: '/manifest.json',
}

export const viewport: Viewport = {
  themeColor: "#22c55e",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Manrope Google Fonts link */}
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope&display=swap"
          rel="stylesheet"
        />
        
        {/* Google Sans */}
        <link href="https://fonts.cdnfonts.com/css/google-sans"
          rel="stylesheet"
        />

      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}
