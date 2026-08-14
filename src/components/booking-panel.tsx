'use client';

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Phone,
  Stethoscope,
  ArrowLeft,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { Clinic, Service } from '@/libs/api/nearbyClinic';
import { ClinicScheduleDay } from '@/libs/api/appointment';
import { Pet } from '@/libs/api/user';

/* ── helpers ── */
function to12Hour(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function formatServiceLabel(service: Service | string): string {
  const serviceName = typeof service === 'string' ? service : service.name;
  return serviceName
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/* ── Calendar grid helper ── */
function buildCalendarGrid(year: number, month: number): (Date | null)[][] {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  // Start week on Monday: Mon=0 … Sun=6
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
  ];

  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }
  const last = weeks[weeks.length - 1];
  while (last.length < 7) last.push(null);
  return weeks;
}

/* ── Safe date label from YYYY-MM-DD ── */
function formatDateLabel(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  // Build a UTC date to avoid local timezone shifting the calendar day
  const d = new Date(Date.UTC(year, month - 1, day));
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/* ── Types ── */
interface BookingPanelProps {
  selectedClinic: Clinic | null;
  scheduleLoading: boolean;
  filteredSchedule: (ClinicScheduleDay & { isOpen: boolean })[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  selectedPetId: string;
  setSelectedPetId: (id: string) => void;
  pets: Pet[];
  notes: string;
  setNotes: (notes: string) => void;
  /** Called when the user taps the back arrow (mobile only) */
  onBack?: () => void;
  handleBook: () => Promise<void>;
  bookingLoading: boolean;
  /** Calendar nav state – controlled by parent so month persists */
  calendarMonth: Date;
  setCalendarMonth: (d: Date) => void;
}

export default function BookingPanel({
  selectedClinic,
  scheduleLoading,
  filteredSchedule,
  selectedDate,
  setSelectedDate,
  selectedTime,
  setSelectedTime,
  selectedPetId,
  setSelectedPetId,
  pets,
  notes,
  setNotes,
  onBack,
  handleBook,
  bookingLoading,
  calendarMonth,
  setCalendarMonth,
}: BookingPanelProps) {
  /* ── empty state ── */
  if (!selectedClinic) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center justify-center py-24 px-6 h-full">
        <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4">
          <Calendar className="w-8 h-8 text-(--acc-clr)" />
        </div>
        <p className="text-base font-semibold text-(--sec-clr) sec-ff">Select a clinic to book</p>
        <p className="text-sm text-gray-400 mt-1 text-center pry-ff">
          Choose a clinic from the list to view available slots.
        </p>
      </div>
    );
  }

  const services = selectedClinic.servicesProvided ?? [];
  const selectedPetName = pets.find((p) => p.id === selectedPetId)?.name;

  const selectedDay = filteredSchedule.find((d) => d.date === selectedDate);
  const morningSlots =
    selectedDay?.slots.filter((s) => parseInt(s.time.split(':')[0], 10) < 12) ?? [];
  const afternoonSlots =
    selectedDay?.slots.filter((s) => parseInt(s.time.split(':')[0], 10) >= 12) ?? [];

  /* Available dates sets */
  const availableDates = new Set(
    filteredSchedule.filter((d) => d.slots.some((s) => s.available)).map((d) => d.date),
  );
  const fullyBookedDates = new Set(
    filteredSchedule.filter((d) => !d.slots.some((s) => s.available)).map((d) => d.date),
  );

  /* Calendar grid */
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  const weeks = buildCalendarGrid(year, month);
  const monthLabel = calendarMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
  const DOW = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

  const prevMonth = () => setCalendarMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarMonth(new Date(year, month + 1, 1));

  const toDateStr = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const timeSlotClass = (time: string, available: boolean) => {
    if (selectedTime === time)
      return 'bg-(--acc-clr) text-white shadow-sm border border-transparent';
    if (available)
      return 'bg-white border border-gray-200 text-(--sec-clr) hover:border-(--acc-clr) hover:bg-green-50';
    return 'bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed line-through decoration-red-300';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 px-4 lg:px-6 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile back button */}
          {onBack && (
            <button
              onClick={onBack}
              className="lg:hidden w-8 h-8 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0 hidden lg:flex">
            <Calendar className="w-4 h-4 text-(--acc-clr)" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-(--sec-clr) sec-ff truncate">
              {selectedClinic.clinicName}
            </p>
            <p className="text-sm text-gray-400 mt-1 text-center pry-ff hidden">
              {typeof selectedClinic.address === 'string' ? selectedClinic.address : `${selectedClinic.address?.street || ''}, ${selectedClinic.address?.city || ''}`}
            </p>
            <p className="text-xs text-gray-400 pry-ff hidden lg:block">
              {selectedPetId
                ? `Select a date and time for ${selectedPetName}'s visit`
                : 'Select your pet, then pick a date and time'}
            </p>
            <p className="text-[11px] text-gray-400 pry-ff lg:hidden">
              {selectedPetId ? `${selectedPetName}'s visit` : 'Select pet, date & time'}
            </p>
          </div>
        </div>

        {/* Pet selector */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-xs text-gray-500 sec-ff hidden lg:inline">Booking for:</span>
          <div className="relative">
            <select
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
              className="appearance-none bg-gray-50 border border-gray-200 text-xs lg:text-sm font-semibold text-(--sec-clr) rounded-xl pl-2.5 lg:pl-3 pr-6 lg:pr-8 py-2 focus:outline-none focus:border-(--acc-clr) sec-ff cursor-pointer max-w-[130px] lg:max-w-none"
            >
              <option value="">Select pet</option>
              {pets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {scheduleLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-5 h-5 text-acc-clr animate-spin" />
        </div>
      ) : (
        <div className="p-4 lg:p-6 space-y-5 lg:space-y-6">
          {/* Booking-for banner */}
          {selectedPetId && (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-3 flex items-center gap-3">
              <Stethoscope className="w-5 h-5 text-acc-clr shrink-0" />
              <p className="text-sm font-semibold text-sec-clr sec-ff">
                Booking for <span className="font-bold">{selectedPetName}</span>
              </p>
            </div>
          )}

          {/* Services */}
          {services.length > 0 && (
            <div>
              <h3 className="text-xs lg:text-sm font-bold text-sec-clr sec-ff mb-2 uppercase tracking-wide lg:normal-case lg:tracking-normal">
                Services Offered
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {services.map((service, i) => (
                  <span
                    key={i}
                    className="text-[10px] lg:text-[11px] font-semibold bg-green-50 text-green-700 border border-green-100 px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full flex items-center gap-1 sec-ff"
                  >
                    <Stethoscope className="w-2.5 h-2.5 lg:w-3 lg:h-3" />
                    {formatServiceLabel(service)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Animals Handled */}
          {selectedClinic.animalsHandled && selectedClinic.animalsHandled.length > 0 && (
            <div>
              <h3 className="text-xs lg:text-sm font-bold text-sec-clr sec-ff mb-2 uppercase tracking-wide lg:normal-case lg:tracking-normal">
                Animals We Treat
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedClinic.animalsHandled.map((animal, index) => (
                  <span
                    key={index}
                    className="text-[10px] lg:text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 lg:px-2.5 py-0.5 lg:py-1 rounded-full flex items-center gap-1 sec-ff"
                  >
                    {animal}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* ── Calendar grid ── */}
          <div>
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs lg:text-sm font-bold text-sec-clr sec-ff">
                {monthLabel}
              </h2>
              <div className="flex gap-1 lg:gap-1.5">
                <button
                  onClick={prevMonth}
                  className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-600" />
                </button>
                <button
                  onClick={nextMonth}
                  className="w-7 h-7 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <ChevronRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-gray-600" />
                </button>
              </div>
            </div>

            {/* DOW headers */}
            <div className="grid grid-cols-7 mb-1">
              {DOW.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-wide py-1"
                >
                  {d}
                </div>
              ))}
            </div>

            {/* Date cells */}
            <div className="space-y-1">
              {weeks.map((week, wi) => (
                <div key={wi} className="grid grid-cols-7 gap-0.5">
                  {week.map((date, di) => {
                    if (!date) {
                      return <div key={di} />;
                    }
                    const ds = toDateStr(date);
                    const isPast = date < today;
                    const isAvail = availableDates.has(ds);
                    const isFull = fullyBookedDates.has(ds);
                    const isActive = selectedDate === ds;
                    const isToday = toDateStr(date) === toDateStr(today);
                    const isDisabled = isPast || !isAvail;

                    return (
                      <button
                        key={di}
                        disabled={isDisabled}
                        onClick={() => {
                          setSelectedDate(ds);
                          setSelectedTime('');
                        }}
                        className={`
                          relative flex flex-col items-center justify-center
                          h-9 lg:h-10 rounded-xl font-semibold text-sm
                          transition-all duration-150
                          ${
                            isActive
                              ? 'bg-(--acc-clr) text-white shadow-sm'
                              : isAvail && !isPast
                                ? 'bg-gray-50 border border-gray-200 text-(--sec-clr) hover:border-(--acc-clr) hover:bg-green-50'
                                : isPast
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : 'bg-gray-50 border border-gray-100 text-gray-300 cursor-not-allowed'
                          }
                        `}
                      >
                        <span
                          className={`text-xs lg:text-sm leading-none ${
                            isActive ? 'text-white' : ''
                          }`}
                        >
                          {date.getDate()}
                        </span>
                        {isToday && !isActive && (
                          <span className="absolute bottom-1 w-1 h-1 rounded-full bg-(--acc-clr)" />
                        )}
                        {isFull && !isPast && !isActive && (
                          <span className="absolute top-0.5 right-0.5 text-[7px] font-bold text-red-400 leading-none">
                            F
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {filteredSchedule.length === 0 && (
              <p className="text-sm text-gray-400 py-4 text-center sec-ff">
                No available dates.
              </p>
            )}
          </div>

          {/* ── Time slots ── */}
          {selectedDay && (
            <div className="space-y-3">
              <h3 className="text-xs lg:text-sm font-bold text-(--sec-clr) sec-ff uppercase tracking-wide lg:normal-case lg:tracking-normal">
                Available Time Slots
              </h3>

              {morningSlots.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 pry-ff">
                    Morning
                  </p>
                  <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {morningSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 sec-ff ${timeSlotClass(slot.time, slot.available)}`}
                      >
                        {to12Hour(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {afternoonSlots.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5 pry-ff">
                    Afternoon
                  </p>
                  <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                    {afternoonSlots.map((slot) => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-2 lg:py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all duration-150 sec-ff ${timeSlotClass(slot.time, slot.available)}`}
                      >
                        {to12Hour(slot.time)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedDay.slots.every((s) => !s.available) && (
                <p className="text-gray-400 text-xs lg:text-sm text-center py-3 sec-ff">
                  No available time slots.
                </p>
              )}
            </div>
          )}

          {/* ── Booking policy ── */}
          <div className="bg-green-50 border border-green-100 rounded-2xl p-3 lg:p-4 flex gap-2.5 lg:gap-3">
            <Info className="w-3.5 h-3.5 lg:w-4 lg:h-4 text-(--acc-clr) flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs lg:text-sm font-semibold text-(--sec-clr) sec-ff hidden lg:block">
                Booking Policy
              </p>
              <p className="text-xs text-gray-600 pry-ff mt-0 lg:mt-0.5 leading-relaxed">
                Appointments must be manually confirmed by the clinic before they are finalized.
              </p>
            </div>
          </div>

          {/* ── Clinic info cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3">
            <div className="flex items-center gap-2 lg:gap-3 bg-gray-50 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-gray-100">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                <Clock className="w-4 h-4 lg:w-5 lg:h-5 text-(--acc-clr)" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] lg:text-[10px] font-semibold text-(--acc-clr) uppercase tracking-wide sec-ff">
                  Hours
                </p>
                <p className="text-xs lg:text-sm font-bold text-(--sec-clr) sec-ff truncate">
                  {selectedClinic.startingTime && selectedClinic.closingTime
                    ? `${selectedClinic.startingTime} – ${selectedClinic.closingTime}`
                    : 'See schedule'}
                </p>
                <p className="text-[10px] text-gray-500 pry-ff truncate hidden lg:block">
                  {(selectedClinic.daysOpen ?? []).slice(0, 3).join(', ') || '—'}
                  {(selectedClinic.daysOpen ?? []).length > 3 ? '…' : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-3 bg-gray-50 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-gray-100">
              <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl bg-pry-clr border border-gray-200 flex items-center justify-center shrink-0">
                <Phone className="w-4 h-4 lg:w-5 lg:h-5 text-acc-clr" />
              </div>
              <div className="min-w-0">
                <p className="text-[9px] lg:text-[10px] font-semibold text-acc-clr uppercase tracking-wide sec-ff">
                  Lead Vet
                </p>
                <p className="text-xs lg:text-sm font-bold text-sec-clr sec-ff truncate">
                  Call Clinic
                </p>
                <p className="text-[10px] text-gray-500 pry-ff truncate">
                  {selectedClinic.phoneNumber ?? '—'}
                </p>
              </div>
            </div>

            {selectedClinic.animalsHandled && selectedClinic.animalsHandled.length > 0 && (
              <div className="flex items-center gap-2 lg:gap-3 bg-gray-50 rounded-xl lg:rounded-2xl p-3 lg:p-4 border border-gray-100 col-span-2 lg:col-span-1">
                <div className="min-w-0">
                  <p className="text-[9px] lg:text-[10px] font-semibold text-blue-600 uppercase tracking-wide sec-ff">
                    Animals Treated
                  </p>
                  <p className="text-xs lg:text-sm font-bold text-sec-clr sec-ff truncate">
                    {selectedClinic.animalsHandled.slice(0, 3).join(', ')}
                    {selectedClinic.animalsHandled.length > 3 ? '...' : ''}
                  </p>
                  <p className="text-[10px] text-gray-500 pry-ff truncate hidden lg:block">
                    {selectedClinic.animalsHandled.length} species available
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ── Notes (optional) ── */}
          {selectedPetId && selectedDate && selectedTime && (
            <div>
              <label className="text-xs lg:text-sm font-bold text-(--sec-clr) sec-ff uppercase tracking-wide lg:normal-case lg:tracking-normal block mb-1.5">
                Reason <span className="text-gray-400 font-normal normal-case">(optional)</span>
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything the vet should know before the visit..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl lg:rounded-2xl p-3 text-sm text-(--sec-clr) placeholder:text-gray-400 pry-ff resize-none focus:outline-none focus:border-(--acc-clr) focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* ── Book CTA ── */}
          {selectedPetId && selectedDate && selectedTime && (
            <button
              onClick={handleBook}
              disabled={bookingLoading}
              className="w-full bg-acc-clr hover:bg-green-500 text-white py-3.5 lg:py-4 rounded-2xl font-bold text-sm shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 sec-ff"
            >
              {bookingLoading ? (
                <Loader2 className="w-5 h-5 text-pry-clr animate-spin" />
              ) : (
                <>
                  <Calendar className="w-4 h-4 shrink-0" />
                  <span className="truncate">
                    Request Appointment — {formatDateLabel(selectedDate)}, {to12Hour(selectedTime)}
                  </span>
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}