import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — SkyDeck Cloud Portal",
  description: "Sign in to access the SkyDeck multi-cloud management dashboard.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
