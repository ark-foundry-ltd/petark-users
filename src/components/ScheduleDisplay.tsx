'use client';

import { useEffect, useState } from 'react';
import { getClinicSchedule, ClinicScheduleDay } from '@/libs/api/appointment';

interface ScheduleDisplayProps {
    clinicId: string;
}

// "HH:mm" -> "9:00 AM"
function to12Hour(time24: string): string {
    const [h, m] = time24.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

export default function ScheduleDisplay({ clinicId }: ScheduleDisplayProps) {
    const [schedule, setSchedule] = useState<ClinicScheduleDay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchSchedule() {
            try {
                setLoading(true);
                setError(null);
                const data = await getClinicSchedule(clinicId);
                setSchedule(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : 'Failed to load schedule');
            } finally {
                setLoading(false);
            }
        }

        fetchSchedule();
    }, [clinicId]);

    if (loading) return <p>Loading schedule...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!schedule.length) return <p>No schedule available.</p>;

    return (
        <div className="space-y-4">
            {schedule.map(day => (
                <div key={day.date} className="border p-3 rounded-md">
                    <h3 className="font-semibold">
                        {day.day} — {day.date} {day.isOpen ? '(Open)' : '(Closed)'}
                    </h3>

                    {day.isOpen && day.opensAt && day.closesAt ? (
                        <div className="mt-2 space-y-2">
                            <p className="text-sm text-gray-600">
                                Open {to12Hour(day.opensAt)} – {to12Hour(day.closesAt)}
                            </p>

                            {day.bookedTimes.length > 0 ? (
                                <div>
                                    <p className="text-xs text-gray-500 mb-1">Already booked:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {day.bookedTimes.map(time => (
                                            <span
                                                key={time}
                                                className="px-3 py-1 rounded bg-gray-300 text-gray-600 text-sm"
                                            >
                                                {to12Hour(time)}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <p className="text-sm text-green-600">No bookings yet. Any time is free.</p>
                            )}
                        </div>
                    ) : (
                        <p className="text-gray-500 mt-1">Closed.</p>
                    )}
                </div>
            ))}
        </div>
    );
}