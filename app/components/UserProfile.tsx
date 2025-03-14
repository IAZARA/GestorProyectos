'use client';
import React from 'react';
import Image from 'next/image';
import { User } from '../../types/user';

interface UserProfileProps {
  user: User;
}

export default function UserProfile({ user }: UserProfileProps) {
  // Usar una imagen por defecto o un placeholder si no hay foto de perfil
  const profileImage = user.photoUrl || '/images/logo.png';

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex flex-col items-center">
        <div className="relative w-32 h-32 mb-4">
          <Image
            src={profileImage}
            alt={`${user.firstName} ${user.lastName}`}
            fill
            className="rounded-full object-cover"
          />
        </div>
        <h2 className="text-xl font-semibold text-gray-800">
          {user.firstName} {user.lastName}
        </h2>
        <span className="px-4 py-1 mt-2 text-sm font-medium text-white rounded-full"
              style={{
                backgroundColor: user.expertise === 'Administrativo' ? '#4F46E5' :
                               user.expertise === 'Tecnico' ? '#059669' :
                               '#DC2626'
              }}>
          {user.expertise}
        </span>
        <p className="mt-2 text-gray-600">{user.email}</p>
      </div>
    </div>
  );
} 