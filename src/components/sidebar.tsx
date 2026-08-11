'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
    LayoutDashboard,
    Settings,
    Calendar,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    LogOut,
    ClipboardCheck,
    User,
    Loader2,
    PawPrint,
} from 'lucide-react';
import { toast } from 'sonner';

import { useSidebar } from '@/context/sidebar-context';
import { useAuthStore, OwnerProfile, Pet } from '@/store/auth';
import { getUserProfile } from '@/libs/api/user';

const NAV_ITEMS = [
    { label: 'Dashboard',    href: '/dashboard',              icon: LayoutDashboard },
    { label: 'Appointments', href: '/dashboard/appointments', icon: Calendar },
    { label: 'Records',      href: '/dashboard/records',      icon: ClipboardCheck },
];

/* ── profile hook ──
 * No setState in the effect body — all state updates happen inside
 * async callbacks (.then / .catch), which are non-cascading.
 * A ref guards against double-fetch in React StrictMode.
 * "loading" is derived: token present but profile not yet hydrated.
 */
function useOwnerProfile() {
    const { profile, setProfile, logout } = useAuthStore();
    const fetchedRef = useRef(false);

    useEffect(() => {
        if (fetchedRef.current) return; // guard against StrictMode double-fire only

        const token = localStorage.getItem('token');
        if (!token) return;

        fetchedRef.current = true;

        getUserProfile()
            .then((ownerProfile) => {
                setProfile(ownerProfile, token);
            })
            .catch((err: unknown) => {
                fetchedRef.current = false;
                toast.error(err instanceof Error ? err.message : 'Failed to load profile');
                logout();
            });
    }, [setProfile, logout]); // removed `profile` from deps

    const hasToken =
        typeof window !== 'undefined' && !!localStorage.getItem('token');
    const loading = hasToken && !profile;

    return { loading, ownerProfile: profile as OwnerProfile | null };
}

/* ── profile dropdown ── */
interface ProfileDropdownProps {
    ownerProfile: OwnerProfile;
    align?: 'left' | 'right';
    direction?: 'up' | 'down';
    collapsed?: boolean;
}

function ProfileDropdown({
    ownerProfile,
    align = 'right',
    direction = 'up',
    collapsed = false,
}: ProfileDropdownProps) {
    const { logout } = useAuthStore();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const petCount = ownerProfile.pets?.length ?? 0;

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const handleLogout = () => {
        logout();
        router.replace('/login');
        setOpen(false);
    };

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(o => !o)}
                title={collapsed ? (ownerProfile.fullname || undefined) : undefined}
                className={`
                    flex items-center gap-2.5 rounded-xl w-full
                    hover:bg-gray-100 transition-colors duration-150
                    ${collapsed ? 'justify-center p-2' : 'pl-1 pr-3 py-1.5'}
                `}
            >
                {/* Pet avatars / fallback */}
                <div className="flex items-center shrink-0">
                    {petCount === 0 && (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38E07B] to-[#2bc466] flex items-center justify-center border-2 border-white shadow-sm">
                            <User className="w-4 h-4 text-white" />
                        </div>
                    )}

                    {petCount === 1 && (
                        <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden">
                            {ownerProfile.pets![0].photo ? (
                                <Image
                                    src={ownerProfile.pets![0].photo}
                                    alt={ownerProfile.pets![0].name ?? 'Pet'}
                                    width={32}
                                    height={32}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-bg-clr">
                                    <PawPrint className="w-4 h-4 text-pry-clr" />
                                </div>
                            )}
                        </div>
                    )}

                    {petCount > 1 && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-8 h-8 rounded-full border-2 border-white shadow-sm overflow-hidden">
                                {ownerProfile.pets![0].photo ? (
                                    <Image
                                        src={ownerProfile.pets![0].photo}
                                        alt={ownerProfile.pets![0].name ?? 'Pet'}
                                        width={32}
                                        height={32}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-bg-clr">
                                        <PawPrint className="w-4 h-4 text-pry-clr" />
                                    </div>
                                )}
                            </div>
                            <span className="text-xs font-semibold text-gray-500">
                                +{petCount - 1}
                            </span>
                        </div>
                    )}
                </div>

                {!collapsed && (
                    <>
                        <div className="flex flex-col leading-tight text-left min-w-0 flex-1">
                            <span className="text-sm font-semibold text-gray-800 sec-ff truncate">
                                {ownerProfile.fullname}
                            </span>
                            <span className="text-[11px] text-gray-400 pry-ff">
                                {petCount} pet{petCount !== 1 ? 's' : ''}
                            </span>
                        </div>
                        <ChevronDown
                            className={`w-3.5 h-3.5 text-gray-400 flex-shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
                        />
                    </>
                )}
            </button>

            {open && (
                <div
                    className={`
                        absolute w-52 bg-white border border-gray-100
                        rounded-2xl shadow-lg shadow-black/10 overflow-hidden z-50 sec-ff
                        ${direction === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'}
                        ${align === 'right' ? 'right-0' : 'left-0'}
                    `}
                >
                    <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-xs text-gray-400 pry-ff">Signed in as</p>
                        <p className="text-sm font-semibold text-gray-800 truncate sec-ff">
                            {ownerProfile.fullname}
                        </p>
                    </div>
                    <div className="p-1.5">
                        <Link
                            href="/dashboard/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 sec-ff"
                        >
                            <User className="w-4 h-4 text-gray-400" />
                            View Profile
                        </Link>
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors duration-150 sec-ff"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ── main export ── */
export default function Sidebar() {
    const pathname = usePathname();
    const { collapsed, setCollapsed } = useSidebar();
    const { loading, ownerProfile } = useOwnerProfile();

    return (
        <>
            {/* ═══════════════════════════════════════════════
                DESKTOP sidebar — sticky, in-flow (md+)
                Shares the row with <main>; no fixed/absolute.
            ═══════════════════════════════════════════════ */}
            <aside
                className={`
                    hidden md:flex flex-col
                    sticky top-0 h-screen self-start
                    bg-white border-r border-gray-100 shadow-sm
                    transition-[width] duration-300 ease-in-out
                    flex-shrink-0 pry-ff overflow-hidden
                    ${collapsed ? 'w-[72px]' : 'w-60'}
                `}
            >
                {/* Brand */}
                <div className={`flex items-center h-16 px-4 border-b border-gray-100 flex-shrink-0 ${collapsed ? 'justify-center' : 'gap-3'}`}>
                    <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
                        <Image
                            src="/green_logo_icon-removebg.png"
                            alt="PetArk logo"
                            width={32}
                            height={32}
                            priority
                            className="flex-shrink-0"
                        />
                        {!collapsed && (
                            <span className="text-lg font-bold text-gray-800 tracking-tight truncate">PetArk</span>
                        )}
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 overflow-y-auto overflow-x-hidden">
                    {!collapsed && (
                        <p className="px-3 mb-3 text-[10px] font-semibold text-gray-400 uppercase tracking-widest whitespace-nowrap">
                            Menu
                        </p>
                    )}
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <li key={href}>
                                    <Link
                                        href={href}
                                        title={collapsed ? label : undefined}
                                        className={`
                                            flex items-center px-3 py-2.5 rounded-xl
                                            transition-all duration-150 active:scale-[0.96]
                                            ${collapsed ? 'justify-center' : 'gap-3'}
                                            ${isActive
                                                ? 'bg-(--acc-clr) text-white shadow-sm'
                                                : 'hover:bg-gray-100 text-gray-700'
                                            }
                                        `}
                                    >
                                        <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                                        {!collapsed && (
                                            <span className="text-sm font-medium whitespace-nowrap">{label}</span>
                                        )}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-gray-100 space-y-1 flex-shrink-0">
                    {/* Profile */}
                    {loading && (
                        <div className={`flex items-center px-3 py-2.5 ${collapsed ? 'justify-center' : ''}`}>
                            <Loader2 className="w-5 h-5 text-gray-400 animate-spin flex-shrink-0" />
                        </div>
                    )}
                    {!loading && ownerProfile && (
                        <ProfileDropdown
                            ownerProfile={ownerProfile}
                            align="left"
                            direction="up"
                            collapsed={collapsed}
                        />
                    )}

                    {/* Settings */}
                    <Link
                        href="/dashboard/settings"
                        title={collapsed ? 'Settings' : undefined}
                        className={`
                            flex items-center px-3 py-2.5 rounded-xl
                            transition-all duration-150 active:scale-[0.96]
                            ${collapsed ? 'justify-center' : 'gap-3'}
                            ${pathname === '/dashboard/settings'
                                ? 'bg-(--acc-clr) text-white'
                                : 'hover:bg-gray-100 text-gray-700'
                            }
                        `}
                    >
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="text-sm font-medium whitespace-nowrap">Settings</span>}
                    </Link>

                    {/* Collapse toggle */}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`
                            flex items-center w-full px-3 py-2.5 rounded-xl
                            text-gray-400 hover:bg-gray-100 transition-all duration-150
                            ${collapsed ? 'justify-center' : 'gap-3'}
                        `}
                    >
                        {collapsed
                            ? <ChevronRight className="w-4 h-4 flex-shrink-0" />
                            : (
                                <>
                                    <ChevronLeft className="w-4 h-4 flex-shrink-0" />
                                    <span className="text-xs font-medium whitespace-nowrap">Collapse</span>
                                </>
                            )
                        }
                    </button>
                </div>
            </aside>

            {/* ═══════════════════════════════════════════════
                MOBILE top bar (< md) — fixed, full-width
            ═══════════════════════════════════════════════ */}
            <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b border-gray-100 shadow-sm flex items-center justify-between px-4">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <Image
                        src="/green_logo_icon-removebg.png"
                        alt="PetArk logo"
                        width={28}
                        height={28}
                        priority
                    />
                    <span className="text-base font-bold text-gray-800 tracking-tight sec-ff">PetArk</span>
                </Link>

                <div className="flex items-center gap-2">
                    {loading && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                    {!loading && ownerProfile && (
                        <ProfileDropdown
                            ownerProfile={ownerProfile}
                            align="right"
                            direction="down"
                            collapsed={false}
                        />
                    )}
                </div>
            </header>

            {/* ═══════════════════════════════════════════════
                MOBILE bottom nav (< md) — fixed, full-width
            ═══════════════════════════════════════════════ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
                <ul className="flex items-stretch h-16">
                    {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
                        const isActive = pathname === href;
                        return (
                            <li key={href} className="flex-1 relative">
                                <Link
                                    href={href}
                                    className="flex flex-col items-center justify-center h-full gap-1 transition-all duration-150 active:scale-[0.92]"
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-(--acc-clr)' : 'text-gray-400'}`} />
                                    <span className={`text-[10px] font-semibold sec-ff ${isActive ? 'text-(--acc-clr)' : 'text-gray-400'}`}>
                                        {label}
                                    </span>
                                    {isActive && (
                                        <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-(--acc-clr)" />
                                    )}
                                </Link>
                            </li>
                        );
                    })}

                    {/* Settings */}
                    <li className="flex-1 relative">
                        <Link
                            href="/dashboard/settings"
                            className="flex flex-col items-center justify-center h-full gap-1 transition-all duration-150 active:scale-[0.92]"
                        >
                            <Settings className={`w-5 h-5 ${pathname === '/dashboard/settings' ? 'text-(--acc-clr)' : 'text-gray-400'}`} />
                            <span className={`text-[10px] font-semibold sec-ff ${pathname === '/dashboard/settings' ? 'text-(--acc-clr)' : 'text-gray-400'}`}>
                                Settings
                            </span>
                            {pathname === '/dashboard/settings' && (
                                <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-(--acc-clr)" />
                            )}
                        </Link>
                    </li>
                </ul>
            </nav>
        </>
    );
}