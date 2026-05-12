import { UserShell } from "@/components/layout/UserShell";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UserShell>{children}</UserShell>;
}
