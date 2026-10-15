'use client';

import { useEffect, useRef, useState } from 'react';
import {
    getClinicSchedule,
    ClinicScheduleDay,
    bookAppointments,
    BookAppointmentQuery,
} from '@/libs/api/appointment';
import axios, { AxiosError } from 'axios';
import { ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Spinner from './ui/spinner';
import { toast } from 'sonner';

// Fetch user's pets
async function getMyPets() {
    const token = localStorage.getItem('token');
    const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/appointment/user/me/pets`,
        { headers: { Authorization: `Bearer ${token}` } }
    );
    return res.data.data.pets as { _id: string; name: string }[];
}

/* ── helpers ── */
function to12Hour(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// "YYYY-MM-DD" -> a local Date for that calendar day (no timezone shifting)
function parseDay(dateStr: string): Date {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// Why this time can't be booked (the server checks again; this just saves a round trip)
function timeProblemFor(
    day: ClinicScheduleDay | undefined,
    dateStr: string,
    time: string,
): string | null {
    if (!day || !time) return null;
    if (!day.isOpen || !day.opensAt || !day.closesAt) return 'The clinic is closed on this day.';
    if (time < day.opensAt || time >= day.closesAt) {
        return `Appointments run from ${to12Hour(day.opensAt)} to ${to12Hour(day.closesAt)}.`;
    }
    if (new Date(`${dateStr}T${time}`).getTime() < Date.now()) {
        return 'That time has already passed.';
    }
    if (day.bookedTimes.includes(time)) {
        return 'Another appointment is already booked at that time.';
    }
    return null;
}

interface Props {
    clinicId: string;
    vetId?: string;
}

export default function BookAppointment({ clinicId, vetId }: Props) {
    const [schedule, setSchedule] = useState<ClinicScheduleDay[]>([]);
    const [pets, setPets] = useState<{ _id: string; name: string }[]>([]);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState(''); // "HH:mm"
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const dateRef = useRef<HTMLDivElement | null>(null);

    const now = new Date();
    const todayStr = localDateStr(now);
    const nowHHmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Dates are the clinic's calendar days (YYYY-MM-DD), so compare them as strings
    const filteredSchedule = schedule.filter(d => d.date >= todayStr);
    const selectedDay = filteredSchedule.find(d => d.date === selectedDate);

    const timeProblem = timeProblemFor(selectedDay, selectedDate, selectedTime);
    const canBook = !!selectedPetId && !!selectedDate && !!selectedTime && !timeProblem;

    useEffect(() => {
        async function fetchData() {
            setSelectedDate('');
            setSelectedTime('');
            try {
                const [sched, myPets] = await Promise.all([
                    getClinicSchedule(clinicId),
                    getMyPets(),
                ]);
                setSchedule(sched);
                setPets(myPets);
            } catch (err: unknown) {
                const message =
                    err instanceof AxiosError
                        ? err.response?.data?.message ?? 'Failed to load schedule'
                        : err instanceof Error
                            ? err.message
                            : 'Failed to load schedule';
                toast.error(message);
            }
        }
        fetchData();
    }, [clinicId]);

    // Re-read the clinic's calendar from the server (after a booking, or a clash)
    const refreshSchedule = async () => {
        try {
            setSchedule(await getClinicSchedule(clinicId));
        } catch {
            // keep showing what we already have
        }
    };

    const scroll = (ref: React.RefObject<HTMLDivElement | null>, dir: 'left' | 'right') => {
        ref.current?.scrollBy({ left: dir === 'left' ? -250 : 250, behavior: 'smooth' });
    };

    const handleBook = async () => {
        if (!selectedPetId || !selectedDate || !selectedTime) {
            toast.error('Select pet, date and time');
            return;
        }
        if (timeProblem) {
            toast.error(timeProblem);
            return;
        }

        setLoading(true);
        try {
            const query: BookAppointmentQuery = { clinicId, vetId };
            const time12 = to12Hour(selectedTime); // the server expects "10:30 AM"
            await bookAppointments(
                {
                    petId: selectedPetId,
                    date: selectedDate,
                    time: time12,
                    ...(notes.trim() ? { notes: notes.trim() } : {}),
                },
                query
            );

            toast.success(`Appointment requested for ${time12}. The clinic will confirm it.`);

            await refreshSchedule();

            setSelectedTime('');
            setSelectedDate('');
            setNotes('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                const message =
                    err.response?.data?.message ||
                    (typeof err.response?.data === 'string'
                        ? err.response.data
                        : 'Failed to book appointment');
                toast.error(message);
            } else if (err instanceof Error) {
                toast.error(err.message);
            } else {
                toast.error('Failed to book appointment');
            }
            // If someone just took that time, show it as taken
            await refreshSchedule();
        } finally {
            setLoading(false);
        }
    };

    const getMonthHeader = () => {
        if (!filteredSchedule.length) return '';
        return parseDay(filteredSchedule[0].date).toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className="min-h-screen bg-[#D7F9E5] p-4 sm:p-6 lg:p-8 pry-ff">
            <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#38E07B] p-6 sm:p-8 rounded-t-3xl text-white">
                    <h1 className="text-2xl sm:text-3xl font-bold">Book an Appointment</h1>
                    <p className="text-white/90 mt-1">Select your pet, date, and time</p>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                    {/* PET SELECTION */}
                    <div>
                        <label className="block font-semibold mb-2">Select Your Pet</label>
                        <select
                            value={selectedPetId}
                            onChange={e => setSelectedPetId(e.target.value)}
                            className="w-full border-2 border-[#38E07B]/30 p-3 sm:p-4 rounded-xl focus:outline-none focus:border-[#38E07B]"
                        >
                            <option value="">-- Select a pet --</option>
                            {pets.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* DATE SELECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="font-bold text-lg">{getMonthHeader() || 'Available Dates'}</h2>
                            <div className="flex gap-2">
                                <button onClick={() => scroll(dateRef, 'left')} className="p-2 rounded-full bg-[#D7F9E5] hover:bg-[#38E07B] hover:text-white">
                                    <ChevronLeft size={20} />
                                </button>
                                <button onClick={() => scroll(dateRef, 'right')} className="p-2 rounded-full bg-[#D7F9E5] hover:bg-[#38E07B] hover:text-white">
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        </div>

                        <div ref={dateRef} className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                            {filteredSchedule.map(day => {
                                const dayName = day.day.slice(0, 3);
                                const dayNum = parseDay(day.date).getDate();
                                // Closed days can't be picked, and neither can today once the clinic has closed
                                const closedForToday =
                                    day.date === todayStr && !!day.closesAt && nowHHmm >= day.closesAt;
                                const selectable = day.isOpen && !closedForToday;

                                return (
                                    <button
                                        key={day.date}
                                        onClick={() => {
                                            if (!selectable) return;
                                            setSelectedDate(day.date);
                                            setSelectedTime('');
                                        }}
                                        disabled={!selectable}
                                        className={`relative flex flex-col items-center justify-center min-w-[72px] sm:min-w-[80px] p-2 rounded-2xl font-semibold transition-all transform hover:scale-105
                                            ${selectedDate === day.date
                                                ? 'bg-[#38E07B] text-white shadow-lg'
                                                : selectable
                                                    ? 'bg-white border-2 border-[#38E07B]/30 text-[#333333]'
                                                    : 'bg-gray-100 border-2 border-gray-200 text-gray-300 cursor-not-allowed opacity-70'
                                            }`}
                                    >
                                        <span className={`text-xs sm:text-sm ${!selectable ? 'line-through decoration-red-400' : ''}`}>
                                            {dayName}
                                        </span>
                                        <span className={`text-lg sm:text-xl ${!selectable ? 'line-through decoration-red-400' : ''}`}>
                                            {dayNum}
                                        </span>
                                        {!selectable && (
                                            <span className="text-[9px] font-bold uppercase tracking-wide text-red-400 leading-tight mt-0.5">
                                                Closed
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* TIME */}
                        {selectedDay?.isOpen && selectedDay.opensAt && selectedDay.closesAt && (
                            <div className="space-y-2">
                                <h3 className="font-bold">Pick a Time</h3>

                                <p className="text-sm text-gray-500 flex items-center gap-1.5">
                                    <Clock size={14} />
                                    Open {to12Hour(selectedDay.opensAt)} – {to12Hour(selectedDay.closesAt)}
                                </p>

                                <input
                                    type="time"
                                    value={selectedTime}
                                    min={selectedDay.opensAt}
                                    max={selectedDay.closesAt}
                                    onChange={e => setSelectedTime(e.target.value)}
                                    className="w-full sm:w-64 border-2 border-[#38E07B]/30 p-3 sm:p-4 rounded-xl focus:outline-none focus:border-[#38E07B] [color-scheme:light]"
                                />

                                {selectedDay.bookedTimes.length > 0 && (
                                    <p className="text-sm text-gray-400">
                                        Already booked: {selectedDay.bookedTimes.map(to12Hour).join(', ')}
                                    </p>
                                )}

                                {timeProblem && <p className="text-sm text-red-500">{timeProblem}</p>}
                            </div>
                        )}

                        {filteredSchedule.length === 0 && (
                            <p className="text-gray-500 text-center mt-2">No available dates</p>
                        )}

                        {/* NOTES (optional) */}
                        {canBook && (
                            <div className="mt-4">
                                <label className="block font-semibold mb-2">
                                    Notes <span className="text-gray-400 font-normal">(optional)</span>
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={e => setNotes(e.target.value)}
                                    placeholder="Anything the vet should know before the visit..."
                                    rows={3}
                                    className="w-full border-2 border-[#38E07B]/30 p-3 sm:p-4 rounded-xl focus:outline-none focus:border-[#38E07B] resize-none"
                                />
                            </div>
                        )}

                        {/* CONFIRM BUTTON */}
                        {canBook && (
                            <button
                                onClick={handleBook}
                                disabled={loading}
                                className="w-full mt-4 bg-[#38E07B] text-white py-4 rounded-2xl font-bold hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                                {loading
                                    ? <Spinner />
                                    : `Confirm Booking - ${parseDay(selectedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${to12Hour(selectedTime)}`}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
            `}</style>
        </div>
    );
}