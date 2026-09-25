'use client';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import Spinner from '@/components/ui/spinner';
import { getAppointmentById, Appointment } from '@/libs/api/appointment';
import {
  Calendar, User, Heart, Clock, FileText, CheckCircle,
  XCircle, AlertCircle, ArrowLeft, Phone, Mail, MapPin,
  Activity, Stethoscope, Scale, Venus,
  Building2, Star, ChevronRight, Syringe, Dna, Tag, CalendarDays
} from 'lucide-react';
import Image from 'next/image';

export default function AppointmentDetails() {
  const { appointmentId } = useParams() as { appointmentId: string };
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!appointmentId) return;
    const fetchAppointment = async () => {
      setLoading(true);
      try {
        const appointmentData = await getAppointmentById(appointmentId, 'owner');
        setAppointment(appointmentData);
      } catch (error) {
        if (error instanceof Error) toast.error(error.message);
        else toast.error('Error fetching appointment');
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [appointmentId]);

  const getStatusConfig = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return { gradient: 'from-emerald-400 to-teal-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: <CheckCircle className="w-4 h-4" />, label: 'Confirmed' };
      case 'completed':
        return { gradient: 'from-blue-400 to-indigo-500', light: 'bg-blue-50 text-blue-700 border-blue-200', icon: <CheckCircle className="w-4 h-4" />, label: 'Completed' };
      case 'pending':
        return { gradient: 'from-amber-400 to-orange-500', light: 'bg-amber-50 text-amber-700 border-amber-200', icon: <AlertCircle className="w-4 h-4" />, label: 'Pending' };
      case 'cancelled':
        return { gradient: 'from-red-400 to-rose-500', light: 'bg-red-50 text-red-700 border-red-200', icon: <XCircle className="w-4 h-4" />, label: 'Cancelled' };
      case 'missed': 
        return { gradient: 'from-gray-400 to-slate-500', light: 'bg-gray-50 text-gray-700 border-gray-200', icon: <AlertCircle className="w-4 h-4" />, label: 'Missed' };
      default:
        return { gradient: 'from-gray-400 to-slate-500', light: 'bg-gray-50 text-gray-700 border-gray-200', icon: <Clock className="w-4 h-4" />, label: status };
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const capitalize = (s?: string) => s ? s.charAt(0).toUpperCase() + s.slice(1) : 'N/A';

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen sec-ff" style={{ background: 'linear-gradient(135deg, #e8faf2 0%, #d0f5e4 100%)' }}>
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-white shadow-lg flex items-center justify-center">
            <Spinner />
          </div>
          <p className="text-[#1a6b47] font-semibold tracking-wide text-sm">Loading appointment...</p>
        </div>
      </div>
    );

  if (!appointment)
    return (
      <div className="flex items-center justify-center min-h-screen sec-ff" style={{ background: 'linear-gradient(135deg, #e8faf2 0%, #d0f5e4 100%)' }}>
        <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md text-center">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Appointment Not Found</h2>
          <p className="text-gray-500 mb-8 text-sm leading-relaxed">The appointment you&apos;re looking for doesn&apos;t exist or has been removed.</p>
          <button
            onClick={() => router.back()}
            className="px-8 py-3 bg-[#38E07B] text-white rounded-xl font-semibold hover:bg-[#2bc466] transition-all shadow-md"
          >
            Go Back
          </button>
        </div>
      </div>
    );

  const statusConfig = getStatusConfig(appointment.status);
  const refId = `APT-${appointmentId.slice(-8).toUpperCase()}`;

  return (
    <div className="min-h-screen sec-ff" style={{ background: 'linear-gradient(135deg, #e8faf2 0%, #d0f5e4 50%, #c5f0db 100%)' }}>
      <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow hover:shadow-md transition-all hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4 text-gray-700" />
            </button>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-0.5">
                <span className="text-[#38E07B] font-medium cursor-pointer hover:underline" onClick={() => router.back()}>Appointments</span>
                <ChevronRight className="w-3 h-3" />
                <span>Details</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Appointment Details</h1>
            </div>
          </div>
          {/* <button className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-xl text-sm font-semibold text-gray-700 shadow hover:shadow-md transition-all hover:scale-105">
            <Bell className="w-4 h-4 text-[#38E07B]" />
            Remind Me
          </button> */}
        </div>

        {/* ── Reference + Status banner ── */}
        <div className={`bg-gradient-to-r ${statusConfig.gradient} rounded-2xl p-5 text-white shadow-lg mb-6`}>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {statusConfig.icon}
              </div>
              <div>
                <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Appointment Status</p>
                <h2 className="text-xl font-bold">{statusConfig.label}</h2>
              </div>
            </div>
            <div className="text-right">
              <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Reference</p>
              <p className="text-lg font-bold font-mono">{refId}</p>
            </div>
          </div>
        </div>

        {/* ── Main Content Grid ── */}
        <div className="grid lg:grid-cols-5 gap-5">

          {/* LEFT: Pet */}
          <div className="lg:col-span-2 space-y-5">

            {/* Pet Card */}
            {appointment.pet && (
              <div className="bg-white rounded-2xl shadow overflow-hidden">
                <div className="relative h-52 bg-gradient-to-br from-[#38E07B] to-[#2bc466]">
                  {appointment.pet.photo ? (
                    <Image
                      fill
                      src={appointment.pet.photo}
                      alt={appointment.pet.name}
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Heart className="w-20 h-20 text-white/25" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
                    <div>
                      <p className="text-white/70 text-xs font-medium uppercase tracking-wider">Patient</p>
                      <h3 className="text-white text-2xl font-bold">{appointment.pet.name}</h3>
                    </div>
                    <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full border border-white/30">
                      ID: {appointment.pet._id.slice(-6).toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="grid grid-cols-2 gap-2.5">
                    <InfoTile label="Species" value={capitalize(appointment.pet.species)} icon={<Dna className="w-3.5 h-3.5" />} />
                    <InfoTile label="Breed" value={appointment.pet.breed || 'N/A'} icon={<Tag className="w-3.5 h-3.5" />} />
                    <InfoTile label="Age" value={appointment.pet.age != null ? `${appointment.pet.age} yrs` : 'N/A'} icon={<CalendarDays className="w-3.5 h-3.5" />} />
                    {appointment.pet.weight && (
                      <InfoTile label="Weight" value={`${appointment.pet.weight} kg`} icon={<Scale className="w-3.5 h-3.5" />} />
                    )}
                    {appointment.pet.gender && (
                      <InfoTile label="Gender" value={capitalize(appointment.pet.gender)} icon={<Venus className="w-3.5 h-3.5" />} />
                    )}
                  </div>

                  {appointment.pet.qrCode && (
                    <div className="mt-2 bg-[#38E07B]/10 rounded-lg p-2 flex items-center justify-center border border-(--pry-clr)">
                      <Image
                        src={appointment.pet.qrCode}
                        alt={`${appointment.pet.name} QR Code`}
                        width={150}
                        height={150}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: Appointment info */}
          <div className="lg:col-span-3 space-y-5">

            {/* Schedule */}
            <div className="bg-white rounded-2xl shadow p-5">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="w-4 h-4 text-[#38E07B]" />
                <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Appointment Schedule</h4>
              </div>
              <div className="bg-gradient-to-br from-[#e8faf2] to-[#d0f5e4] rounded-xl p-4 mb-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Date</p>
                <p className="text-lg font-bold text-gray-900">{appointment.date ? formatDate(appointment.date) : 'N/A'}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-[#f0fbf5] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Clock className="w-4 h-4 text-[#38E07B]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Time</p>
                    <p className="font-bold text-gray-800 text-sm">{appointment.date ? formatTime(appointment.date) : 'N/A'}</p>
                  </div>
                </div>
                <div className="bg-[#f0fbf5] rounded-xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                    <Activity className="w-4 h-4 text-[#38E07B]" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Duration</p>
                    <p className="font-bold text-gray-800 text-sm">30 mins</p>
                  </div>
                </div>
              </div>
              {/* Booked / Confirmed timestamps */}
              <div className="grid grid-cols-2 gap-3">
                {appointment.timeBooked && (
                  <div className="bg-[#f0fbf5] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Booked On</p>
                    <p className="font-bold text-gray-800 text-xs">{formatDate(appointment.timeBooked)}</p>
                    <p className="text-xs text-gray-500">{formatTime(appointment.timeBooked)}</p>
                  </div>
                )}
                {appointment.timeConfirmed && (
                  <div className="bg-[#f0fbf5] rounded-xl p-3">
                    <p className="text-xs text-gray-400 mb-0.5">Confirmed On</p>
                    <p className="font-bold text-gray-800 text-xs">{formatDate(appointment.timeConfirmed)}</p>
                    <p className="text-xs text-gray-500">{formatTime(appointment.timeConfirmed)}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Service / Type */}
            {appointment.type && (
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Stethoscope className="w-4 h-4 text-[#38E07B]" />
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Reason for Visit</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#38E07B]" />
                  <p className="text-gray-900 font-semibold capitalize text-base">{appointment.type}</p>
                </div>
              </div>
            )}

            {/* Vet — only render if assigned */}
            {appointment.vet && (
              <div className="bg-white rounded-2xl shadow p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#38E07B]" />
                  <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Assigned Veterinarian</h4>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-xl flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">{appointment.vet.fullname}</p>
                    <p className="text-xs text-gray-400">{appointment.vet.email}</p>
                  </div>
                </div>
              </div>
            )}

{/* Clinic */}
{appointment.clinic && (
  <div className="bg-white rounded-2xl shadow p-5">
    <div className="flex items-center gap-2 mb-3">
      <Building2 className="w-4 h-4 text-[#38E07B]" />
      <h4 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">Clinic Details</h4>
    </div>
    {appointment.clinic.clinicName && (
      <p className="font-bold text-gray-900 mb-2 text-base">{appointment.clinic.clinicName}</p>
    )}
    <div className="space-y-2">
      {appointment.clinic.email && (
        <ContactRow icon={<Mail className="w-3.5 h-3.5 text-[#38E07B]" />} value={appointment.clinic.email} />
      )}
      {appointment.clinic.phoneNumber && (
        <ContactRow icon={<Phone className="w-3.5 h-3.5 text-[#38E07B]" />} value={appointment.clinic.phoneNumber} />
      )}
      {appointment.clinic.address && (
        <ContactRow
          icon={<MapPin className="w-3.5 h-3.5 text-[#38E07B]" />}
          value={[
            appointment.clinic.address.street,
            appointment.clinic.address.city,
            appointment.clinic.address.state,
            appointment.clinic.address.country
          ].filter(Boolean).join(', ')}
        />
      )}
      {(appointment.clinic.startingTime || appointment.clinic.closingTime) && (
        <ContactRow
          icon={<Clock className="w-3.5 h-3.5 text-[#38E07B]" />}
          value={`${appointment.clinic.startingTime ?? ''} – ${appointment.clinic.closingTime ?? ''}`}
        />
      )}
      {appointment.clinic.daysOpen && appointment.clinic.daysOpen.length > 0 && (
        <div className="bg-[#f0fbf5] rounded-xl px-3 py-2.5">
          <p className="text-xs text-gray-400 mb-1.5 font-medium">Open Days</p>
          <div className="flex flex-wrap gap-1.5">
            {appointment.clinic.daysOpen.map((day) => (
              <span
                key={day}
                className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#38E07B]/15 text-[#1a6b47]"
              >
                {day}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
)}

            {/* Notes */}
            {appointment.notes && (
              <div className="rounded-2xl shadow p-5 border-2 border-amber-100 bg-linear-to-br from-amber-50 to-orange-50">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-linear-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-sm shrink-0 mt-0.5">
                    <FileText className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-1 text-sm">Pre-Visit Notes</h4>
                    <p className="text-gray-700 text-sm leading-relaxed italic">&quot;{appointment.notes}&quot;</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Tiny helper components ── */

function InfoTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-[#f0fbf5] rounded-xl p-3">
      <p className="text-xs text-gray-400 font-medium mb-0.5 flex items-center gap-1">
        <span className="text-[#38E07B]">{icon}</span> {label}
      </p>
      <p className="font-bold text-gray-800 text-sm truncate">{value}</p>
    </div>
  );
}

function ContactRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-start gap-2.5 bg-[#f0fbf5] rounded-xl px-3 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-xs text-gray-700 leading-relaxed break-all">{value}</span>
    </div>
  );
}