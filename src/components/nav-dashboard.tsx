'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuthStore, OwnerProfile, Pet } from '@/store/auth';
import { getUserProfile } from '@/libs/api/user';
import { toast } from 'sonner';
import Image from 'next/image';
import Link from 'next/link';
import { PawPrint, ChevronDown, LogOut, User, Loader2 } from 'lucide-react';

export default function NavDashboard() {
    const { profile, setProfile, logout } = useAuthStore();
    const [loading, setLoading]           = useState(true);
    const [searchQuery, setSearchQuery]   = useState('');
    const [menuOpen, setMenuOpen]         = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const loadProfile = async () => {
            const token = localStorage.getItem('token');
            if (!token) { setLoading(false); return; }
            if (profile) { setLoading(false); return; }

            try {
                const fetched = await getUserProfile();
                const ownerProfile: OwnerProfile = {
                    id: fetched.id,
                    fullname: fetched.fullname ?? 'Unknown',
                    email: fetched.email ?? '',
                    phoneNumber: fetched.phoneNumber ?? '',
                    address: fetched.address ?? {},
                    pets: (fetched.pets ?? []) as Pet[],
                    type: 'owner',
                };
                setProfile(ownerProfile, token);
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to load profile');
                logout();
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [profile, setProfile, logout]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!loading && (!profile || profile.type !== 'owner')) return null;

    const ownerProfile = profile as OwnerProfile;
    const petCount     = ownerProfile?.pets?.length ?? 0;

    return (
        <nav className="sticky top-0 z-30 bg-pry-clr border-b border-gray-100 shadow-sm">
            <div className="max-w-[1220px] mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <Link href="/dashboard" className="text-white font-bold text-lg sec-ff">
                        <Image src="/petark_logo.png" alt="PetTrak" width={40} height={40} className="rounded-full object-cover" />
                    </Link>
                </div>

                {/* Right actions */}
                <div className="flex items-center gap-2">

                    {/* Divider */}
                    <div className="w-px h-6 bg-gray-200 mx-1" />

                    {/* Spinner while loading */}
                    {loading && (
                        <div className="w-10 h-10 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />
                        </div>
                    )}

                    {/* Profile dropdown */}
                    {!loading && ownerProfile && (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setMenuOpen(!menuOpen)}
                                className="flex items-center gap-2.5 pl-1 pr-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors duration-150 group"
                            >
                                {/* Pet avatars or fallback */}
                                <div className="flex -space-x-2 shrink-0">
                                    {petCount > 0
                                        ? ownerProfile.pets?.slice(0, 3).map((pet: Pet, i: number) => (
                                            <div
                                                key={pet.id}
                                                className="w-8 h-8 rounded-full border-2 border-pry-clr shadow-sm overflow-hidden"
                                                style={{ zIndex: petCount - i }}
                                            >
                                                <Image
                                                    src={pet.photo ?? '/default-pet.png'}
                                                    alt={pet.name ?? 'Pet'}
                                                    width={32}
                                                    height={32}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                        ))
                                        : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38E07B] to-[#2bc466] flex items-center justify-center border-2 border-pry-clr shadow-sm">
                                                <User className="w-4 h-4 text-pry-clr" />
                                            </div>
                                        )
                                    }
                                </div>

                                {/* Name + pet count */}
                                <div className="hidden sm:flex flex-col leading-tight">
                                    <span className="text-sm font-semibold text-gray-800 sec-ff truncate max-w-[120px]">
                                        {ownerProfile.fullname}
                                    </span>
                                    <span className="text-[11px] text-gray-400 pry-ff">
                                        {petCount} pet{petCount !== 1 ? 's' : ''}
                                    </span>
                                </div>

                                <ChevronDown
                                    className={`w-3.5 h-3.5 text-gray-400 hidden sm:block flex-shrink-0 transition-transform duration-150 ${menuOpen ? 'rotate-180' : ''}`}
                                />
                            </button>

                            {/* Dropdown menu */}
                            {menuOpen && (
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute right-0 mt-2 w-52 bg-pry-clr border border-gray-100 rounded-2xl shadow-lg shadow-black/10 overflow-hidden z-50 sec-ff"
                                >
                                    <div className="px-4 py-3 border-b border-gray-50">
                                        <p className="text-xs text-gray-400 pry-ff">Signed in as</p>
                                        <p className="text-sm font-semibold text-gray-800 truncate sec-ff">
                                            {ownerProfile.fullname}
                                        </p>
                                    </div>

                                    <div className="p-1.5">
                                        <Link
                                            href="/dashboard/profile"
                                            onClick={() => setMenuOpen(false)}
                                            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150 sec-ff"
                                        >
                                            <User className="w-4 h-4 text-gray-400" />
                                            View Profile
                                        </Link>

                                        <button
                                            onClick={() => { logout(); setMenuOpen(false); }}
                                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors duration-150 sec-ff"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign out
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}