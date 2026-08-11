'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { getUserProfile } from '@/libs/api/user';
import type { Pet } from '@/libs/api/user';
import { Loader2, PawPrint, Weight, Venus, Mars, CircleHelp } from 'lucide-react';

function GenderIcon({ gender }: Readonly<{ gender?: string }>) {
  const g = gender?.toLowerCase();
  if (g === 'male')   return <Mars   size={11} className="text-blue-400" />;
  if (g === 'female') return <Venus  size={11} className="text-pink-400" />;
  return <CircleHelp size={11} className="text-gray-300" />;
}

function PetCard({ pet }: Readonly<{ pet: Pet }>) {
  return (
    <div className="flex items-stretch gap-0 bg-pry-clr rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden w-full">

      {/* Photo — full height left strip */}
      <div className="relative w-28 sm:w-32 shrink-0 bg-bg-clr">
        {pet.photo && pet.photo !== '' ? (
          <Image
            src={pet.photo}
            alt={pet.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-pry-clr" />
          </div>
        )}
      </div>

      {/* Right content */}
      <div className="flex-1 min-w-0 px-3 py-3 flex flex-col justify-between">

        {/* Top: name + badge */}
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-bold text-sec-clr sec-ff truncate">{pet.name}</h3>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide shrink-0"
              style={{ backgroundColor: '#d1fae5', color: '#065f46' }}
            >
              HEALTHY
            </span>
          </div>

          {/* Species · Breed */}
          <p className="text-[11px] text-gray-400 pry-ff mt-0.5 truncate">
            {pet.species}{pet.breed ? ` · ${pet.breed}` : ''}
          </p>
        </div>

        {/* Bottom: age · weight · gender pills */}
        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">

          {pet.age && (
            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
              <PawPrint size={10} className="text-gray-400" />
              <span className="text-[10px] text-gray-500 pry-ff font-medium">{pet.age} yrs</span>
            </span>
          )}

          {pet.weight && (
            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
              <Weight size={10} className="text-gray-400" />
              <span className="text-[10px] text-gray-500 pry-ff font-medium">{pet.weight} kg</span>
            </span>
          )}

          {pet.gender && (
            <span className="flex items-center gap-1 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
              <GenderIcon gender={pet.gender} />
              <span className="text-[10px] text-gray-500 pry-ff font-medium capitalize">{pet.gender}</span>
            </span>
          )}

        </div>
      </div>
    </div>
  );
}

export default function MyPets() {
  const [pets, setPets]       = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    getUserProfile()
      .then((profile) => setPets(profile.pets ?? []))
      .catch(() => setError('Failed to load pets'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 text-center py-6">{error}</p>;
  }

  if (pets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-2 text-gray-400">
        <PawPrint size={32} strokeWidth={1.5} />
        <p className="text-sm pry-ff">No pets added yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {pets.map((pet) => (
        <PetCard key={pet.id} pet={pet} />
      ))}
    </div>
  );
}