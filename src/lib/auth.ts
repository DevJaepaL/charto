import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";

type SupportedProvider = "google" | "kakao";

type ProviderConfig = {
  id: SupportedProvider;
  name: string;
  clientId: string;
  clientSecret: string;
};

const authSecret = process.env.AUTH_SECRET?.trim() ?? "";

const providerConfigs: ProviderConfig[] = [
  process.env.AUTH_GOOGLE_ID?.trim() && process.env.AUTH_GOOGLE_SECRET?.trim()
    ? {
        id: "google",
        name: "Google",
        clientId: process.env.AUTH_GOOGLE_ID.trim(),
        clientSecret: process.env.AUTH_GOOGLE_SECRET.trim(),
      }
    : null,
  process.env.AUTH_KAKAO_ID?.trim() && process.env.AUTH_KAKAO_SECRET?.trim()
    ? {
        id: "kakao",
        name: "Kakao",
        clientId: process.env.AUTH_KAKAO_ID.trim(),
        clientSecret: process.env.AUTH_KAKAO_SECRET.trim(),
      }
    : null,
].filter(Boolean) as ProviderConfig[];

export const configuredAuthProviders = authSecret ? providerConfigs : [];
export const isAuthEnabled = Boolean(authSecret && configuredAuthProviders.length);

export const authOptions: NextAuthOptions = {
  secret: authSecret || undefined,
  session: {
    strategy: "jwt",
  },
  providers: configuredAuthProviders.map((provider) => {
    if (provider.id === "google") {
      return GoogleProvider({
        clientId: provider.clientId,
        clientSecret: provider.clientSecret,
      });
    }

    return KakaoProvider({
      clientId: provider.clientId,
      clientSecret: provider.clientSecret,
    });
  }),
};

export function getServerAuthSession() {
  if (!isAuthEnabled) {
    return Promise.resolve(null);
  }

  return getServerSession(authOptions);
}
