export function resolveUserGreetingName(options: {
  nickname?: string | null;
  email?: string | null;
}): string {
  const nickname = options.nickname?.trim();
  if (nickname) {
    return nickname;
  }

  const email = options.email?.trim();
  if (email) {
    const localPart = email.split("@")[0]?.trim();
    if (localPart) {
      return localPart;
    }
  }

  return "고객";
}
