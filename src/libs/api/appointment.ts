// src/libs/api/appointment.ts
import api from "./axiosInstance"; //use the configured instance, not raw axios
import { AxiosError } from "axios";

/* ================= TYPES ================= */

export type UserAddress = {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode?: string | null;
};

export type Appointment = {
  _id: string;
  userId: string;
  type?: string;
  date: string;
  status: string;
  notes?: string;
  timeBooked?: string;
  timeConfirmed?: string;

  pet: {
    _id: string;
    name: string;
    species: string;
    breed: string;
    age: number | string;
    weight?: number;
    gender?: string;
    photo?: string;
    qrCode?: string;
  };

  clinic: {
    _id: string;
    clinicName: string;
    email: string;
    phoneNumber?: string;       // was phone
    address?: UserAddress;
    daysOpen?: string[];
    startingTime?: string;
    closingTime?: string;
  };

  vet?: {
    _id: string;
    fullname: string;
    email?: string;
  } | null;

  owner?: {                     // optional — not in current response
    _id: string;
    fullname: string;
    email: string;
    phoneNumber?: string;
    address?: UserAddress;
  } | null;
};


/* ================= BOOKING TYPES ================= */

export interface BookAppointmentData {
  petId: string;
  date: string; // YYYY-MM-DD
  time: string; // "10:30 AM"
  notes?: string;
}

export interface BookAppointmentQuery {
  clinicId: string;
  vetId?: string;
}

// What the server answers with after a booking request
export interface BookAppointmentResult {
  appointmentId: string;
  date: string;
  status: string;
  notes?: string;
  pet?: { _id: string; name: string };
  clinic?: { _id: string; clinicName: string };
}

/* ================= SCHEDULE TYPES ================= */

// One day of a clinic's calendar. There are no fixed slots: any time from opensAt up to
// (not including) closesAt can be booked, except times already taken (bookedTimes).
export type ClinicScheduleDay = {
  date: string;            // YYYY-MM-DD (clinic-local)
  day: string;             // Monday
  isOpen: boolean;
  opensAt: string | null;  // "HH:mm"
  closesAt: string | null; // "HH:mm"
  bookedTimes: string[];   // "HH:mm" of appointments already booked that day
};

export type ClinicDayAvailability = ClinicScheduleDay & {
  clinicId?: string;
  message?: string;
};

/* ================= API FUNCTIONS ================= */

export async function bookAppointments(
  appointmentData: BookAppointmentData,
  query: BookAppointmentQuery
): Promise<BookAppointmentResult> {
  const token = localStorage.getItem("token") || "";

  const queryString = `?${new URLSearchParams({
    clinicId: query.clinicId,
    ...(query.vetId ? { vetId: query.vetId } : {}),
  }).toString()}`;

  const response = await api.post(
    `${process.env.NEXT_PUBLIC_API_URL}/appointment/book${queryString}`,
    appointmentData,
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data as BookAppointmentResult;
}

/* ================= CLINIC SCHEDULE ================= */
export async function getClinicSchedule(
  clinicId: string,
  days: number = 14
): Promise<ClinicScheduleDay[]> {
  const token = localStorage.getItem("token") || "";

  const response = await api.get(
    `${process.env.NEXT_PUBLIC_API_URL}/appointment/clinics/${clinicId}/schedule`,
    {
      params: { days },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data.schedule as ClinicScheduleDay[];
}

/* ================= CLINIC AVAILABILITY ================= */
export async function getClinicAvailability(
  clinicId: string,
  date: string
): Promise<ClinicDayAvailability> {
  const token = localStorage.getItem("token") || "";

  const response = await api.get(
    `${process.env.NEXT_PUBLIC_API_URL}/appointment/clinics/${clinicId}/availability`,
    {
      params: { date },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data.data as ClinicDayAvailability;
}

/* ================= USER PETS ================= */

export async function getMyPets() {
  const token = localStorage.getItem("token") || "";

  const res = await api.get(
    `${process.env.NEXT_PUBLIC_API_URL}/appointment/user/me/pets`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return res.data.data.pets;
}

export async function getAppointments(status?: string): Promise<Appointment[]> {
  try {
    const res = await api.get("/appointment/users", {
      params: status ? { status } : undefined,
    });

    return res.data.appointments;
  } catch (err: unknown) {
    let msg = "Failed to fetch appointments";
    if (err instanceof AxiosError) {
      if (err.response?.status === 401) msg = "Session expired. Please login again.";
      else if (err.response?.status === 403) msg = "You don't have permission to view appointments.";
      else msg = err.response?.data?.message ?? msg;
    }
    throw new Error(msg);
  }
}
/* ================= SINGLE APPOINTMENT ================= */

export const getAppointmentById = async (
  appointmentId: string,
  role: string = "owner"
): Promise<Appointment> => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = localStorage.getItem("token");

  if (!token) throw new Error("Not authenticated");
  if (!appointmentId) throw new Error("Appointment ID is required");

  const res = await fetch(`${apiUrl}/appointment/users/${appointmentId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.message || "Failed to fetch appointment");
  }

  return data.data.appointment as Appointment;
};