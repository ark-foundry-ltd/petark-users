// app/(owner)/dashboard/layout.tsx

'use client';

import { ReactNode } from 'react';
import Sidebar from '@/components/sidebar';
import { SidebarProvider } from '@/context/sidebar-context';
import { Toaster } from 'sonner';
import { IOSInstallBanner } from '@/components/notifications/IOSInstallBanner';
import { NotificationPermissionBanner } from '@/components/notifications/NotificationPermissionBanner';

interface LayoutProps {
    children: ReactNode;
}

function InnerLayout({ children }: Readonly<LayoutProps>) {
    return (
        <div className="flex flex-row min-h-screen bg-gray-100">
            <Sidebar />

            <main className="flex-1 min-w-0 overflow-auto pt-14 pb-16 md:pt-0 md:pb-0">
                <div className="px-4 pt-4">
                    <IOSInstallBanner />
                    <NotificationPermissionBanner />
                </div>
                {children}
                <Toaster position="top-right" richColors closeButton />
            </main>
        </div>
    );
}

export default function Layout({ children }: Readonly<LayoutProps>) {
    return (
        <SidebarProvider>
            <InnerLayout>{children}</InnerLayout>
        </SidebarProvider>
    );
}