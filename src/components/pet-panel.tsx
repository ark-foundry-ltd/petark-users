"use client";

import { useState, useRef } from "react";
import { useAuthStore, OwnerProfile } from "@/store/auth";
import { createPet, Pet } from "@/libs/api/user";
import {
  PawPrint,
  ChevronRight,
  Plus,
  X,
  Upload,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

const SPECIES_OPTIONS = [
  "dog", "cat", "bird", "rabbit", "fish", "reptile", "other",
];

const GENDER_OPTIONS: ("Male" | "Female" | "Unknown")[] = [
  "Male", "Female", "Unknown",
];

const inputClass =
  "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-(--sec-clr) placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-(--acc-clr)/30 focus:border-(--acc-clr) focus:bg-white transition-all duration-150 sec-ff";

const labelClass =
  "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 pry-ff";

export default function PetsPanel() {
  const { profile, setProfile } = useAuthStore();

  const ownerProfile =
    profile?.type === "owner" ? (profile as OwnerProfile) : null;

  // Read pets directly from store — no network call needed
  const pets: Pet[] = ownerProfile?.pets ?? [];

  // ─────────────────────────────────────────
  // Modal State
  // ─────────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [petName, setPetName] = useState("");
  const [petSpecies, setPetSpecies] = useState("dog");
  const [petBreed, setPetBreed] = useState("");
  const [petAge, setPetAge] = useState("");
  const [petWeight, setPetWeight] = useState("");
  const [petGender, setPetGender] =
    useState<"Male" | "Female" | "Unknown">("Unknown");
  const [petPhoto, setPetPhoto] = useState<File | null>(null);
  const [petPhotoPreview, setPetPhotoPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const openModal = () => setShowModal(true);

  const closeModal = () => {
    setShowModal(false);
    setPetName("");
    setPetSpecies("dog");
    setPetBreed("");
    setPetAge("");
    setPetWeight("");
    setPetGender("Unknown");
    setPetPhoto(null);
    if (petPhotoPreview) URL.revokeObjectURL(petPhotoPreview);
    setPetPhotoPreview(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPetPhoto(file);
    if (petPhotoPreview) URL.revokeObjectURL(petPhotoPreview);
    setPetPhotoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!petName.trim()) {
      toast.error("Pet name is required");
      return;
    }

    setLoading(true);

    try {
      const newPet = await createPet(
        {
          name: petName,
          species: petSpecies,
          breed: petBreed || undefined,
          age: petAge ? Number(petAge) : undefined,
          weight: petWeight ? Number(petWeight) : undefined,
          gender: petGender,
        },
        petPhoto ?? undefined
      );

      // Sync new pet into store — panel re-renders automatically
      if (ownerProfile) {
        setProfile(
          {
            ...ownerProfile,
            pets: [...pets, newPet],
          },
          localStorage.getItem("token")!
        );
      }

      toast.success(`${newPet.name} added successfully`);
      closeModal();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add pet");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  const petContent =
    pets.length > 0 ? (
      pets.map((pet) => (
        <Link
          key={pet.id}
          href={`/dashboard/pets/${pet.id}`}
          className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50 cursor-pointer"
        >
          {pet.photo ? (
            <Image
              src={pet.photo}
              alt={pet.name}
              width={48}
              height={48}
              className="rounded-xl object-cover w-12 h-12"
            />
          ) : (
            <div className="rounded-xl bg-bg-clr w-12 h-12 flex items-center justify-center shrink-0">
              <PawPrint className="w-5 h-5 text-pry-clr" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="truncate font-bold text-sm">{pet.name}</p>
            <p className="text-xs text-gray-500 truncate">
              {pet.species}
              {pet.breed ? ` · ${pet.breed}` : ""}
            </p>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400" />
        </Link>
      ))
    ) : (
      <div className="px-5 py-10 text-center">
        <PawPrint className="w-8 h-8 mx-auto text-gray-300 mb-2" />
        <p className="text-sm font-semibold text-gray-500">No pets yet</p>
        <p className="text-xs text-gray-400">Click `Add Pet` to get started.</p>
      </div>
    );

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        {/* HEADER */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="w-4 h-4 text-acc-clr" />
            <h2 className="text-sm font-bold uppercase pry-ff">My Pets</h2>
          </div>

          <button
            onClick={openModal}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-acc-clr/10 text-acc-clr text-xs font-semibold hover:bg-acc-clr/20"
          >
            <Plus className="w-3 h-3" />
            Add Pet
          </button>
        </div>

        {/* BODY */}
        <div className="divide-y divide-gray-50">{petContent}</div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Add New Pet</h3>
              <button type="button" onClick={closeModal}>
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* PHOTO */}
              <div>
                <label className={labelClass}>Pet Photo</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center cursor-pointer overflow-hidden bg-gray-50 hover:border-(--acc-clr)"
                >
                  {petPhotoPreview ? (
                    <Image
                      src={petPhotoPreview}
                      alt="Preview"
                      width={200}
                      height={200}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <Upload className="w-6 h-6 mx-auto mb-1" />
                      <p className="text-xs">Click to upload</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoChange}
                />
              </div>

              {/* NAME */}
              <div>
                <label className={labelClass}>
                  Name <span className="text-red-400">*</span>
                </label>
                <input
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="e.g. Buddy"
                  className={inputClass}
                />
              </div>

              {/* SPECIES + GENDER */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Species</label>
                  <select
                    value={petSpecies}
                    onChange={(e) => setPetSpecies(e.target.value)}
                    className={inputClass}
                  >
                    {SPECIES_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Gender</label>
                  <select
                    value={petGender}
                    onChange={(e) =>
                      setPetGender(e.target.value as "Male" | "Female" | "Unknown")
                    }
                    className={inputClass}
                  >
                    {GENDER_OPTIONS.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* BREED */}
              <div>
                <label className={labelClass}>Breed</label>
                <input
                  value={petBreed}
                  onChange={(e) => setPetBreed(e.target.value)}
                  placeholder="Optional"
                  className={inputClass}
                />
              </div>

              {/* AGE + WEIGHT */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Age</label>
                  <input
                    type="number"
                    value={petAge}
                    onChange={(e) => setPetAge(e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Weight</label>
                  <input
                    type="number"
                    value={petWeight}
                    onChange={(e) => setPetWeight(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2 rounded-xl border text-sm"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-(--acc-clr) text-white text-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    "Add Pet"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}