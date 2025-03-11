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

// Crear una función para obtener usuarios sin depender de hooks de React
const getUsers = () => {
  return useUserStore.getState().users;
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
          return null;
        }

        try {
          // Obtener usuarios del store
          const users = getUsers();
          const user = users.find(user => user.email === credentials.email);
          
          if (!user || !bcrypt.compareSync(credentials.password, user.password)) {
            console.log("Credenciales incorrectas");
            return null;
          }
          
          console.log("Usuario autenticado:", user.firstName, user.lastName);
          
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