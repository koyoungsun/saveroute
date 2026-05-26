export const SEARCH_HUB_LOGO_SRC = "/icons/saveroute_logo.png";
export const SEARCH_HUB_LOGO_WIDTH = 682;
export const SEARCH_HUB_LOGO_HEIGHT = 67;
export const SEARCH_HUB_LOGO_DISPLAY_HEIGHT = 25;
export const SEARCH_HUB_LOGO_DISPLAY_WIDTH = Math.round(
  SEARCH_HUB_LOGO_WIDTH * (SEARCH_HUB_LOGO_DISPLAY_HEIGHT / SEARCH_HUB_LOGO_HEIGHT),
);

/** Floating / drawer menu — slightly smaller than search hub logo */
export const MENU_LOGO_DISPLAY_HEIGHT = Math.round(SEARCH_HUB_LOGO_DISPLAY_HEIGHT * 0.84);
export const MENU_LOGO_DISPLAY_WIDTH = Math.round(
  SEARCH_HUB_LOGO_WIDTH * (MENU_LOGO_DISPLAY_HEIGHT / SEARCH_HUB_LOGO_HEIGHT),
);

/** Admin sidebar — compact official logo */
export const ADMIN_SIDEBAR_LOGO_DISPLAY_HEIGHT = Math.round(MENU_LOGO_DISPLAY_HEIGHT * 0.92);
export const ADMIN_SIDEBAR_LOGO_DISPLAY_WIDTH = Math.round(
  SEARCH_HUB_LOGO_WIDTH * (ADMIN_SIDEBAR_LOGO_DISPLAY_HEIGHT / SEARCH_HUB_LOGO_HEIGHT),
);
