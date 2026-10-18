import type { SymbolViewProps } from "expo-symbols";

// One registry so every screen uses the same glyph for the same idea.
// SF Symbols on iOS, Material Symbols on Android and web.
export const icons = {
  home: { ios: "house", android: "home", web: "home" },
  homeFill: { ios: "house.fill", android: "home", web: "home" },
  search: { ios: "magnifyingglass", android: "search", web: "search" },
  heart: { ios: "heart", android: "favorite_border", web: "favorite_border" },
  heartFill: { ios: "heart.fill", android: "favorite", web: "favorite" },
  calendar: { ios: "calendar", android: "calendar_today", web: "calendar_today" },
  person: { ios: "person", android: "person", web: "person" },
  settings: { ios: "gearshape", android: "settings", web: "settings" },
  marker: { ios: "mappin", android: "location_on", web: "location_on" }, // map marker on photos
  pin: { ios: "mappin.and.ellipse", android: "location_on", web: "location_on" },
  filters: { ios: "slider.horizontal.3", android: "tune", web: "tune" },
  arrowLeft: { ios: "arrow.left", android: "arrow_back", web: "arrow_back" },
  arrowUp: { ios: "arrow.up", android: "arrow_upward", web: "arrow_upward" }, // send
  arrowUpRight: { ios: "arrow.up.right", android: "north_east", web: "north_east" },
  arrowRight: { ios: "arrow.right", android: "arrow_forward", web: "arrow_forward" },
  chevronLeft: { ios: "chevron.left", android: "chevron_left", web: "chevron_left" },
  chevronDown: { ios: "chevron.down", android: "expand_more", web: "expand_more" },
  chevronRight: { ios: "chevron.right", android: "chevron_right", web: "chevron_right" },
  close: { ios: "xmark", android: "close", web: "close" },
  share: { ios: "square.and.arrow.up", android: "ios_share", web: "ios_share" },
  chat: { ios: "bubble.left", android: "chat_bubble_outline", web: "chat_bubble_outline" },
  policy: { ios: "doc.text", android: "description", web: "description" },
  rosette: { ios: "rosette", android: "workspace_premium", web: "workspace_premium" }, // Superhost
  clock: { ios: "clock", android: "schedule", web: "schedule" }, // check-in and checkout
  moon: { ios: "moon", android: "bedtime", web: "bedtime" }, // quiet hours
  smoking: { ios: "nosign", android: "smoke_free", web: "smoke_free" }, // SF Symbols has no cigarette
  party: { ios: "party.popper", android: "celebration", web: "celebration" },
  bookmark: { ios: "bookmark", android: "bookmark", web: "bookmark" },
  mail: { ios: "envelope", android: "mail", web: "mail" },
  lock: { ios: "lock", android: "lock", web: "lock" },
  eye: { ios: "eye", android: "visibility", web: "visibility" },
  eyeOff: { ios: "eye.slash", android: "visibility_off", web: "visibility_off" },
  sparkles: { ios: "sparkles", android: "auto_awesome", web: "auto_awesome" },
  star: { ios: "star.fill", android: "star", web: "star" },
  cabin: { ios: "tree.fill", android: "forest", web: "forest" },
  beach: { ios: "water.waves", android: "waves", web: "waves" },
  city: { ios: "building.2.fill", android: "apartment", web: "apartment" },
  villa: { ios: "beach.umbrella.fill", android: "villa", web: "villa" }, // neither set has a palm tree
  pets: { ios: "pawprint.fill", android: "pets", web: "pets" },
  hotTub: { ios: "bathtub", android: "hot_tub", web: "hot_tub" },
  pool: { ios: "figure.pool.swim", android: "pool", web: "pool" },
  fireplace: { ios: "fireplace.fill", android: "fireplace", web: "fireplace" },
  firePit: { ios: "flame.fill", android: "local_fire_department", web: "local_fire_department" },
  sauna: { ios: "humidity.fill", android: "sauna", web: "sauna" },
  water: { ios: "water.waves", android: "waves", web: "waves" }, // ocean and lake views
  mountain: { ios: "mountain.2.fill", android: "landscape", web: "landscape" },
  beachAccess: { ios: "beach.umbrella", android: "beach_access", web: "beach_access" },
  workspace: { ios: "desktopcomputer", android: "computer", web: "computer" },
  wifi: { ios: "wifi", android: "wifi", web: "wifi" },
  kitchen: { ios: "fork.knife", android: "restaurant", web: "restaurant" },
  ac: { ios: "snowflake", android: "ac_unit", web: "ac_unit" },
  minus: { ios: "minus", android: "remove", web: "remove" },
  plus: { ios: "plus", android: "add", web: "add" },
  map: { ios: "map", android: "map", web: "map" },
  list: { ios: "list.bullet", android: "list", web: "list" },
  success: { ios: "checkmark.circle.fill", android: "check_circle", web: "check_circle" },
  apple: { ios: "apple.logo", android: "phone_iphone", web: "phone_iphone" }, // iOS-only button; Material has no Apple logo
  error: { ios: "exclamationmark.circle.fill", android: "error", web: "error" },
  wave: { ios: "hand.wave.fill", android: "waving_hand", web: "waving_hand" }, // greeting; the font has no emoji
  globe: { ios: "globe", android: "language", web: "language" }, // languages a host speaks
  wifiOff: { ios: "wifi.slash", android: "wifi_off", web: "wifi_off" }, // can't connect
  warning: { ios: "exclamationmark.triangle", android: "warning", web: "warning" }, // something went wrong
  searchOff: { ios: "text.magnifyingglass", android: "search_off", web: "search_off" }, // no results
  pinOff: { ios: "mappin.slash", android: "wrong_location", web: "wrong_location" }, // stay not found
  card: { ios: "creditcard", android: "credit_card", web: "credit_card" }, // payment methods
  suitcase: { ios: "suitcase", android: "luggage", web: "luggage" }, // trips row
  bell: { ios: "bell", android: "notifications", web: "notifications" },
  help: { ios: "questionmark.circle", android: "help", web: "help" },
  flag: { ios: "flag", android: "flag", web: "flag" }, // report a listing
  logout: { ios: "rectangle.portrait.and.arrow.right", android: "logout", web: "logout" }, // sign out
} as const satisfies Record<string, Exclude<SymbolViewProps["name"], string>>;

export type IconName = keyof typeof icons;
