import { NextResponse } from 'next/server';
import { useUserStore } from '../../../store/userStore';

export async function GET() {
  try {
    // Obtener usuarios del store
    const users = useUserStore.getState().getUsers();
    
    // Buscar usuarios específicos
    const sofiaInStore = users.find(user => 
      user.email.toLowerCase().includes('sofi.varela') || 
      (user.firstName === 'Sofia' && user.lastName === 'Varela')
    );
    
    const maxiInStore = users.find(user => 
      user.email.toLowerCase().includes('maxi.scarimbolo') || 
      (user.firstName === 'Maximiliano' && user.lastName === 'Scarimbolo')
    );
    
    return NextResponse.json({
      totalUsers: users.length,
      users: users.map(user => ({
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role,
        expertise: user.expertise
      })),
      specificUsers: {
        sofiaVarela: sofiaInStore ? {
          found: true,
          details: {
            id: sofiaInStore.id,
            name: `${sofiaInStore.firstName} ${sofiaInStore.lastName}`,
            email: sofiaInStore.email,
            role: sofiaInStore.role,
            expertise: sofiaInStore.expertise
          }
        } : { found: false },
        maximiliano: maxiInStore ? {
          found: true,
          details: {
            id: maxiInStore.id,
            name: `${maxiInStore.firstName} ${maxiInStore.lastName}`,
            email: maxiInStore.email,
            role: maxiInStore.role,
            expertise: maxiInStore.expertise
          }
        } : { found: false }
      }
    });
  } catch (error) {
    console.error('Error al obtener usuarios del store:', error);
    return NextResponse.json(
      { error: 'Error al obtener usuarios del store' },
      { status: 500 }
    );
  }
} 