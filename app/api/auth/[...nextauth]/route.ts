import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { useUserStore } from '../../../../store/userStore';
import bcrypt from 'bcryptjs';
import { User, Role } from '../../../../types/user';

// Extender los tipos para evitar errores de TypeScript
type ExtendedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  image?: string;
};

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.error('Faltan credenciales:', { email: !!credentials?.email, password: !!credentials?.password });
          return null;
        }

        try {
          // Intentar obtener el usuario directamente del store
          const storeUser = await useUserStore.getState().login(credentials.email, credentials.password);
          
          if (storeUser) {
            console.log(`Autenticación exitosa con store para: ${storeUser.email}`);
            
            return {
              id: storeUser.id,
              name: `${storeUser.firstName} ${storeUser.lastName}`,
              email: storeUser.email,
              role: storeUser.role,
              image: storeUser.photoUrl
            } as ExtendedUser;
          }
          
          // Si no se pudo autenticar con el store, intentamos el método tradicional
          const users = useUserStore.getState().getUsers();
          console.log(`Buscando usuario con email: ${credentials.email}`);
          console.log(`Total de usuarios en el store: ${users.length}`);
          
          const user = users.find(user => user.email === credentials.email);
          
          if (!user) {
            console.error(`Usuario no encontrado: ${credentials.email}`);
            return null;
          }

          console.log(`Usuario encontrado: ${user.firstName} ${user.lastName}`);
          console.log(`Verificando contraseña para: ${user.email}`);
          
          // Verificar la contraseña usando bcrypt
          const isValidPassword = await bcrypt.compare(credentials.password, user.password);
          
          if (!isValidPassword) {
            console.error(`Contraseña incorrecta para usuario: ${user.email}`);
            return null;
          }
          
          console.log(`Autenticación exitosa para: ${user.email}`);
          
          return {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            email: user.email,
            role: user.role,
            image: user.photoUrl
          } as ExtendedUser;
        } catch (error) {
          console.error("Error en authorize:", error);
          return null;
        }
      }
    })
  ],
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as Role;
        session.user.id = token.id as string;
      }
      return session;
    }
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  secret: process.env.NEXTAUTH_SECRET || "tu_secreto_para_nextauth",
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST }; 