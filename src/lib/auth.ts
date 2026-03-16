import { getServerSession, type NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import KakaoProvider from "next-auth/providers/kakao";
import type { JWT } from "next-auth/jwt";

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

function resolveDisplayName(input: {
  provider?: SupportedProvider;
  tokenName?: string | null;
  userName?: string | null;
  profileName?: string | null;
  profileNickname?: string | null;
  propertiesNickname?: string | null;
  email?: string | null;
  id?: string | number | null;
}) {
  const candidates = [
    input.tokenName,
    input.userName,
    input.profileName,
    input.profileNickname,
    input.propertiesNickname,
    input.email?.split("@")[0],
  ];

  const resolved = candidates.find((value) => value && value.trim());
  if (resolved) {
    return resolved.trim();
  }

  if (input.provider === "kakao") {
    return input.id ? `Kakao ${input.id}` : "Kakao 사용자";
  }

  return "로그인 사용자";
}

function updateTokenName(
  token: JWT,
  params: {
    provider?: SupportedProvider;
    user?: { name?: string | null; email?: string | null } | null;
    profile?:
      | {
          id?: string | number | null;
          name?: string | null;
          properties?: { nickname?: string | null } | null;
          kakao_account?: {
            email?: string | null;
            profile?: { nickname?: string | null } | null;
          } | null;
        }
      | null;
  },
) {
  const nextName = resolveDisplayName({
    provider: params.provider,
    tokenName: typeof token.name === "string" ? token.name : null,
    userName: params.user?.name,
    profileName: params.profile?.name,
    profileNickname: params.profile?.kakao_account?.profile?.nickname,
    propertiesNickname: params.profile?.properties?.nickname,
    email: params.user?.email ?? params.profile?.kakao_account?.email ?? null,
    id: params.profile?.id ?? null,
  });

  token.name = nextName;
  return token;
}

function normalizeOAuthProfile(profile: unknown) {
  const record =
    profile && typeof profile === "object" ? (profile as Record<string, unknown>) : {};
  const properties =
    record.properties && typeof record.properties === "object"
      ? (record.properties as Record<string, unknown>)
      : null;
  const kakaoAccount =
    record.kakao_account && typeof record.kakao_account === "object"
      ? (record.kakao_account as Record<string, unknown>)
      : null;
  const kakaoProfile =
    kakaoAccount?.profile && typeof kakaoAccount.profile === "object"
      ? (kakaoAccount.profile as Record<string, unknown>)
      : null;

  return {
    id: typeof record.id === "string" || typeof record.id === "number" ? record.id : null,
    name: typeof record.name === "string" ? record.name : null,
    properties: {
      nickname: typeof properties?.nickname === "string" ? properties.nickname : null,
    },
    kakao_account: {
      email: typeof kakaoAccount?.email === "string" ? kakaoAccount.email : null,
      profile: {
        nickname: typeof kakaoProfile?.nickname === "string" ? kakaoProfile.nickname : null,
      },
    },
  };
}

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
      authorization: {
        params: {
          scope: "profile_nickname profile_image",
        },
      },
      profile(profile) {
        return {
          id: String(profile.id),
          name: resolveDisplayName({
            provider: "kakao",
            profileName: profile.kakao_account?.name ?? null,
            profileNickname: profile.kakao_account?.profile?.nickname ?? null,
            propertiesNickname: profile.properties?.nickname ?? null,
            email: profile.kakao_account?.email ?? null,
            id: profile.id,
          }),
          email: profile.kakao_account?.email ?? null,
          image:
            profile.kakao_account?.profile?.profile_image_url ??
            profile.properties?.profile_image ??
            null,
        };
      },
    });
  }),
  callbacks: {
    async jwt({ token, user, account, profile }) {
      return updateTokenName(token, {
        provider: (account?.provider as SupportedProvider | undefined) ?? undefined,
        user: user
          ? {
              name: user.name ?? null,
              email: user.email ?? null,
            }
          : null,
        profile: profile ? normalizeOAuthProfile(profile) : null,
      });
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.name =
          resolveDisplayName({
            tokenName: typeof token.name === "string" ? token.name : null,
            email: session.user.email ?? null,
          }) ?? session.user.name;
      }

      return session;
    },
  },
};

export function getServerAuthSession() {
  if (!isAuthEnabled) {
    return Promise.resolve(null);
  }

  return getServerSession(authOptions);
}
