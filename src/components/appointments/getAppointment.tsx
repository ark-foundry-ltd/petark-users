// src/components/appointments/getAppointment.tsx

'use client';

import { useEffect, useState, useRef } from "react";
import { getAppointments } from "@/libs/api/appointment";
import { useAuthStore } from "@/store/auth";
import { toast } from "sonner";
import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import {
  Calendar, User, MoreVertical, Trash2, ChevronDown, ChevronLeft, ChevronRight, Loader2
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Appointment } from "@/libs/api/appointment";

dayjs.extend(isoWeek);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

const FILTERS = ["Today", "This Week", "Next 30 Days", "All"] as const;
type Filter = typeof FILTERS[number];

const PAGE_SIZE = 5;

const STATUS_STYLES: Record<string, { dot: string; badge: string }> = {
  pending:   { dot: "bg-yellow-400", badge: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  confirmed: { dot: "bg-green-500",  badge: "bg-green-50 text-green-700 border border-green-200" },
  completed: { dot: "bg-blue-400",   badge: "bg-blue-50 text-blue-700 border border-blue-200" },
  cancelled: { dot: "bg-red-400",    badge: "bg-red-50 text-red-700 border border-red-200" },
};

export default function GetAppointments() {
  const { profile } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filtered, setFiltered]         = useState<Appointment[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loading, setLoading]           = useState(true);
  const [openRow, setOpenRow]           = useState<string | null>(null);
  const [page, setPage]                 = useState(1);
  const dropdownRef                     = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      if (!profile || profile.type !== 'owner') { setLoading(false); return; }
      try {
        const data = await getAppointments();
        // newest-upcoming first; sort by date ascending so "next" appointment is on top
        const sorted = [...data].sort((a, b) => dayjs(b.timeBooked).valueOf() - dayjs(a.timeBooked).valueOf());
        setAppointments(sorted);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load appointments");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [profile]);

  useEffect(() => {
    const now = dayjs();
    let next: Appointment[];

    if (activeFilter === "Today") {
      next = appointments.filter(a => dayjs(a.date).isSame(now, "day"));
    } else if (activeFilter === "This Week") {
      next = appointments.filter(a =>
        dayjs(a.date).isSameOrAfter(now, "day") &&
        dayjs(a.date).isSameOrBefore(now.endOf("isoWeek"))
      );
    } else if (activeFilter === "Next 30 Days") {
      next = appointments.filter(a =>
        dayjs(a.date).isSameOrAfter(now, "day") &&
        dayjs(a.date).isSameOrBefore(now.add(30, "day"))
      );
    } else {
      // "All" — no date restriction
      next = appointments;
    }

    setFiltered(next);
    setPage(1); // reset to first page whenever filter or data changes
  }, [activeFilter, appointments]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (!profile || profile.type !== 'owner') {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sec-ff">
        <div className="flex flex-col items-center py-8">
          <User className="w-10 h-10 text-gray-200 mb-3" />
          <p className="text-gray-400 font-semibold text-sm">Access Restricted</p>
          <p className="text-gray-300 text-xs mt-1 pry-ff">Please login as a pet owner.</p>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-pry-clr rounded-2xl border border-gray-100 shadow-sm overflow-hidden sec-ff">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-4 lg:px-6 py-4 border-b border-gray-100 flex-wrap">
        <div>
          <h2 className="text-base lg:text-lg font-bold text-sec-clr pry-ff">Upcoming Appointments</h2>
          <p className="text-gray-400 text-xs mt-0.5 sec-ff">Track and manage your pet visits.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors sec-ff shadow-sm"
            >
              {activeFilter}
              <ChevronDown size={12} className={`text-gray-400 transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-1 w-32 bg-white border border-gray-100 rounded-lg shadow-lg z-20 overflow-hidden">
                {FILTERS.map(f => (
                  <button
                    key={f}
                    onClick={() => { setActiveFilter(f); setDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2 text-xs transition-colors sec-ff
                      ${activeFilter === f
                        ? 'font-bold text-acc-clr bg-gray-50'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 lg:p-4">
        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-acc-clr h-6 w-6" />
          </div>
        )}

        {/* Empty */}
        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-8">
            <Calendar className="w-10 h-10 text-gray-200 mb-3" />
            <p className="text-sm text-gray-400 font-semibold sec-ff">No appointments for {activeFilter.toLowerCase()}</p>
            <p className="text-xs text-gray-300 mt-1 pry-ff">Try a different filter or book a new appointment.</p>
          </div>
        )}

        {/* Table */}
        {!loading && filtered.length > 0 && (
          <div className="overflow-hidden">
            {/* Column headers - hidden on mobile */}
            <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_auto] gap-3 px-3 py-2 bg-gray-50 rounded-lg mb-2">
              {["Pet", "Date & Time", "Status", "Actions"].map(h => (
                <span key={h} className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide sec-ff">{h}</span>
              ))}
            </div>

            <div className="space-y-2">
              {pageItems.map(a => {
                const status = STATUS_STYLES[a.status] ?? { dot: "bg-gray-300", badge: "bg-gray-50 text-gray-500 border border-gray-200" };
                const clinicName = a.clinic?.clinicName ?? '—';

                return (
                  <div key={a._id} className="relative">

                    {/* ── Desktop row ── */}
                    <div className="hidden sm:grid grid-cols-[2fr_1.5fr_1.5fr_1.2fr_auto] gap-3 items-center px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors duration-150 border border-transparent hover:border-gray-100">
                      <Link href={`/dashboard/appointments/${a._id}`} className="contents">
                        {/* Pet */}
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-green-50 border border-gray-100 shrink-0">
                            {a.pet?.photo ? (
                              <Image width={32} height={32} src={a.pet.photo} alt={a.pet?.name ?? 'Pet'} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-sm">🐾</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-sec-clr sec-ff truncate">{a.pet?.name ?? '—'}</p>
                            <p className="text-[10px] text-gray-400 pry-ff truncate">{clinicName}</p>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div>
                          <p className="text-xs font-semibold text-sec-clr sec-ff">{dayjs(a.date).format("DD MMM YYYY")}</p>
                          <p className="text-[10px] text-gray-400 pry-ff">{dayjs(a.date).format("hh:mm A")}</p>
                        </div>

                        {/* Status */}
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg sec-ff w-fit ${status.badge}`}>
                          <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                          {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                        </span>
                      </Link>

                      {/* Actions */}
                      <div className="relative">
                        <button
                          className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                          onClick={() => setOpenRow(openRow === a._id ? null : a._id)}
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                        </button>

                        {openRow === a._id && (
                          <>
                            <div className="fixed inset-0 z-10" onClick={() => setOpenRow(null)} />
                            <div className="absolute right-0 top-8 z-20 bg-white border border-gray-100 rounded-lg shadow-lg w-32 py-1">
                              <button
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors sec-ff"
                                onClick={() => { setOpenRow(null); toast.error('Delete coming soon!'); }}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* ── Mobile card ── */}
                    <div className="sm:hidden flex items-start gap-2 px-3 py-3 rounded-lg hover:bg-gray-50 transition-colors border border-gray-50">
                      <Link href={`/dashboard/appointments/${a._id}`} className="flex items-start gap-2 flex-1 min-w-0">
                        {/* Pet photo */}
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-green-50 border border-gray-100 shrink-0">
                          {a.pet?.photo ? (
                            <Image width={40} height={40} src={a.pet.photo} alt={a.pet?.name ?? 'Pet'} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-base">🐾</div>
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-sec-clr sec-ff truncate">{a.pet?.name ?? '—'}</p>
                            <span className={`inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full sec-ff shrink-0 ${status.badge}`}>
                              <span className={`w-1 h-1 rounded-full ${status.dot}`} />
                              {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-400 pry-ff truncate">{clinicName}</p>
                          <div className="flex items-center gap-1 mt-0.5">
                            <Calendar size={10} className="text-gray-300" />
                            <p className="text-[10px] text-gray-400 pry-ff">
                              {dayjs(a.date).format("DD MMM · hh:mm A")}
                            </p>
                          </div>
                        </div>
                      </Link>

                      {/* Actions */}
                      <div className="relative shrink-0">
                        <button
                          className="w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center justify-center transition-colors"
                          onClick={() => setOpenRow(openRow === a._id ? null : a._id)}
                        >
                          <MoreVertical className="w-3.5 h-3.5 text-gray-500" />
                        </button>

                        {openRow === a._id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setOpenRow(null)} />
                            <div className="absolute right-0 top-8 z-50 bg-white border border-gray-100 rounded-lg shadow-lg w-32 py-1">
                              <button
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 transition-colors sec-ff"
                                onClick={() => { setOpenRow(null); toast.error('Delete coming soon!'); }}
                              >
                                <Trash2 className="w-3.5 h-3.5" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3 px-1 pt-4 mt-2 border-t border-gray-100">
                <p className="text-[11px] text-gray-400 sec-ff">
                  Page {page} of {totalPages} · {filtered.length} appointment{filtered.length !== 1 ? 's' : ''}
                </p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}