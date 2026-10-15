// components/nearby-clinics.tsx

'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { fetchClinics, Clinic } from '@/libs/api/nearbyClinic';
import {
    getClinicSchedule,
    ClinicScheduleDay,
    bookAppointments,
    BookAppointmentQuery,
} from '@/libs/api/appointment';
import { getUserProfile, Pet } from '@/libs/api/user';
import { toast } from 'sonner';

import ClinicList from './clinic-list';
import BookingPanel from './booking-panel';

/* ── helpers ── */
function to12Hour(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function localDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

export default function NearbyClinicsPage() {
    /* ── state ── */
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [filteredClinics, setFilteredClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [schedule, setSchedule] = useState<ClinicScheduleDay[]>([]);
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const [pets, setPets] = useState<Pet[]>([]);
    const [ownerHasPhone, setOwnerHasPhone] = useState<boolean | undefined>(undefined);
    const [selectedPetId, setSelectedPetId] = useState('');
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState(''); // "HH:mm"
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    /* Calendar month – default to current month */
    const [calendarMonth, setCalendarMonth] = useState(
        () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    );

    /* Mobile: 'list' | 'booking' */
    const [mobileView, setMobileView] = useState<'list' | 'booking'>('list');

    /* ── load clinics ── */
    useEffect(() => {
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await fetchClinics();
                if (data?.length > 0) {
                    setClinics(data);
                    setFilteredClinics(data);
                } else {
                    setError('No clinics found.');
                }
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to fetch clinics');
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    /* ── load schedule when clinic changes ── */
    useEffect(() => {
        if (!selectedClinic) return;
        (async () => {
            setScheduleLoading(true);
            setSelectedDate('');
            setSelectedTime('');
            try {
                const [sched, profile] = await Promise.all([
                    getClinicSchedule(selectedClinic._id),
                    getUserProfile(),
                ]);
                setSchedule(sched);
                setPets(profile.pets ?? []);
                setOwnerHasPhone(!!profile.phoneNumber);
            } catch (err: unknown) {
                toast.error(err instanceof Error ? err.message : 'Failed to load schedule');
            } finally {
                setScheduleLoading(false);
            }
        })();
    }, [selectedClinic]);

    /* Re-read the clinic's calendar from the server (after a booking, or a clash) */
    const refreshSchedule = async (clinicId: string) => {
        try {
            setSchedule(await getClinicSchedule(clinicId));
        } catch {
            // keep showing what we already have
        }
    };

    /* ── schedule for the calendar: today onwards (dates are clinic-local YYYY-MM-DD) ── */
    const todayStr = localDateStr(new Date());
    const filteredSchedule = schedule.filter(d => d.date >= todayStr);

    /* ── handlers ── */
    const handleSelectClinic = (clinic: Clinic) => {
        setSelectedClinic(clinic);
        setMobileView('booking');
    };

    const handleBook = async () => {
        if (!selectedClinic) return;
        if (!selectedPetId || !selectedDate || !selectedTime) {
            toast.error('Select pet, date and time');
            return;
        }
        setBookingLoading(true);
        try {
            const query: BookAppointmentQuery = { clinicId: selectedClinic._id };
            const time12 = to12Hour(selectedTime);
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

            await refreshSchedule(selectedClinic._id);

            setSelectedTime('');
            setSelectedDate('');
            setNotes('');
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                toast.error(
                    err.response?.data?.message ??
                    (typeof err.response?.data === 'string'
                        ? err.response.data
                        : 'Failed to book appointment')
                );
            } else {
                toast.error('Failed to book appointment');
            }
            // If someone just took that time, show it as taken
            await refreshSchedule(selectedClinic._id);
        } finally {
            setBookingLoading(false);
        }
    };

    /* ── render ── */
    return (
        <div className="w-full sec-ff mb-16">
            {/* Page header */}
            <div className="mb-4">
                <h1 className="text-xl font-bold text-sec-clr pry-ff">Book Appointment</h1>
                <p className="text-gray-400 text-xs mt-0.5 sec-ff">
                    Find the best care for your furry friends.
                </p>
            </div>

            {/* ── DESKTOP: side-by-side ── */}
            <div className="hidden lg:flex gap-5 items-start w-full">
                {/* Left: clinic list */}
                <div className="w-[360px] xl:w-[400px] flex-shrink-0">
                    <ClinicList
                        clinics={clinics}
                        filteredClinics={filteredClinics}
                        setFilteredClinics={setFilteredClinics}
                        loading={loading}
                        error={error}
                        selectedClinic={selectedClinic}
                        onSelectClinic={handleSelectClinic}
                    />
                </div>

                {/* Right: booking panel */}
                <div className="flex-1 min-w-0">
                    <BookingPanel
                        selectedClinic={selectedClinic}
                        scheduleLoading={scheduleLoading}
                        filteredSchedule={filteredSchedule}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                        selectedPetId={selectedPetId}
                        setSelectedPetId={setSelectedPetId}
                        pets={pets}
                        notes={notes}
                        setNotes={setNotes}
                        ownerHasPhone={ownerHasPhone}
                        handleBook={handleBook}
                        bookingLoading={bookingLoading}
                        calendarMonth={calendarMonth}
                        setCalendarMonth={setCalendarMonth}
                    />
                </div>
            </div>

            {/* ── MOBILE: stacked view ── */}
            <div className="lg:hidden w-full max-w-md mx-auto">
                {mobileView === 'list' ? (
                    <ClinicList
                        clinics={clinics}
                        filteredClinics={filteredClinics}
                        setFilteredClinics={setFilteredClinics}
                        loading={loading}
                        error={error}
                        selectedClinic={selectedClinic}
                        onSelectClinic={handleSelectClinic}
                    />
                ) : (
                    <BookingPanel
                        selectedClinic={selectedClinic}
                        scheduleLoading={scheduleLoading}
                        filteredSchedule={filteredSchedule}
                        selectedDate={selectedDate}
                        setSelectedDate={setSelectedDate}
                        selectedTime={selectedTime}
                        setSelectedTime={setSelectedTime}
                        selectedPetId={selectedPetId}
                        setSelectedPetId={setSelectedPetId}
                        pets={pets}
                        notes={notes}
                        setNotes={setNotes}
                        ownerHasPhone={ownerHasPhone}
                        onBack={() => setMobileView('list')}
                        handleBook={handleBook}
                        bookingLoading={bookingLoading}
                        calendarMonth={calendarMonth}
                        setCalendarMonth={setCalendarMonth}
                    />
                )}
            </div>
        </div>
    );
}