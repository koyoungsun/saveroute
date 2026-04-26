import { UserShell } from "@/components/layout/UserShell";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <UserShell>{children}</UserShell>;
}
