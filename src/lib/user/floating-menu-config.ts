import {
  Bell,
  CreditCard,
  FileText,
  HelpCircle,
  Home,
  LogIn,
  ShieldCheck,
  User,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export type FloatingMenuLinkItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

export type FloatingMenuActionItem = {
  id: string;
  label: string;
  action: "logout";
  icon: LucideIcon;
};

export type FloatingMenuAccountLinkItem = {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  account: true;
};

export type FloatingMenuItem =
  | FloatingMenuLinkItem
  | FloatingMenuActionItem
  | FloatingMenuAccountLinkItem;

export type FloatingMenuLinkGroup = {
  id: string;
  label?: string;
  items: FloatingMenuLinkItem[];
};

const SERVICE_MENU_ITEMS: FloatingMenuLinkItem[] = [
  { id: "notices", label: "공지사항", href: "/notices", icon: Bell },
  { id: "guide", label: "사용방법", href: "/guide", icon: HelpCircle },
];

const POLICY_MENU_ITEMS: FloatingMenuLinkItem[] = [
  { id: "terms", label: "이용약관", href: "/terms", icon: FileText },
  { id: "privacy", label: "개인정보처리방침", href: "/privacy", icon: ShieldCheck },
];

const NAV_MENU_ITEMS: FloatingMenuLinkItem[] = [
  { id: "home", label: "홈", href: "/", icon: Home },
  { id: "my-benefits", label: "내 혜택", href: "/my-benefits", icon: CreditCard },
  { id: "mypage", label: "마이페이지", href: "/mypage", icon: User },
];

export function buildFloatingMenuLinkGroups(
  isAuthenticated: boolean,
): FloatingMenuLinkGroup[] {
  const groups: FloatingMenuLinkGroup[] = [];

  groups.push({
    id: "nav",
    items: isAuthenticated
      ? NAV_MENU_ITEMS
      : NAV_MENU_ITEMS.filter((item) => item.id === "home"),
  });

  groups.push(
    { id: "service", label: "서비스", items: SERVICE_MENU_ITEMS },
    { id: "policy", label: "정책", items: POLICY_MENU_ITEMS },
  );

  return groups;
}

export const GUEST_ACCOUNT_MENU_ITEMS: FloatingMenuAccountLinkItem[] = [
  { id: "login", label: "로그인", href: "/auth/login", icon: LogIn, account: true },
  { id: "signup", label: "회원가입", href: "/auth/signup", icon: UserPlus, account: true },
];
