import { ADAB, CATEGORIES, SERIES, durationForEpisode } from "./seed-data";
import type {
  AppNotification,
  Category,
  Comment,
  CommunityUpload,
  Episode,
  Favorite,
  Progress,
  Role,
  Series,
  SeriesCard,
  Subscription,
  SubscriptionPlan,
  SubscriptionStatus,
  User,
  VideoJob,
} from "./types";

export type {
  Category,
  Series,
  Episode,
  Comment,
  User,
  Subscription,
  Role,
  SeriesCard,
  VideoJob,
  Progress,
  Favorite,
};

export type Store = {
  categories: Category[];
  series: Series[];
  episodes: Episode[];
  users: User[];
  subscriptions: Subscription[];
  comments: Comment[];
  communityUploads: CommunityUpload[];
  notifications: AppNotification[];
  progress: Progress[];
  favorites: Favorite[];
  videoJobs: VideoJob[];
};

const STORAGE_KEY = "qisas_react_store_v2";
export const DB_STORE_KEY = STORAGE_KEY;
const ADMIN_ID = "user-admin";
const DEMO_ID = "user-demo";

function nid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso(offsetMs = 0) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function buildInitialStore(): Store {
  const categories: Category[] = CATEGORIES.map((c) => ({
    id: `cat-${c.slug}`,
    slug: c.slug,
    name: c.name,
    nameSw: c.nameSw,
    order: c.order,
    image: `/media/categories/${c.slug}.jpg`,
    iconName: c.slug,
  }));

  const catBySlug = Object.fromEntries(categories.map((c) => [c.slug, c]));
  const series: Series[] = [];
  const episodes: Episode[] = [];

  SERIES.forEach((s, si) => {
    const row: Series = {
      id: `ser-${s.slug}`,
      slug: s.slug,
      title: s.title,
      titleSw: s.titleSw,
      description: s.description,
      descriptionSw: s.descriptionSw,
      categoryId: catBySlug[s.category]?.id ?? categories[0].id,
      coverGradient: s.coverGradient,
      image: `/media/series/${s.slug}.jpg`,
      backdropImage: `/media/series/${s.slug}.jpg`,
      featured: s.featured,
      published: true,
      views: 3400 + si * 420,
      likes: 210 + si * 35,
      seasonsCount: 1,
      rating: 4.8 + (si % 3) * 0.1,
      tags: ["hadithi", "quran", "visa", s.category],
      createdAt: nowIso(-si * 86_400_000),
    };
    series.push(row);

    const lockedFrom = s.episodeCount > 12 ? s.episodeCount - 1 : s.episodeCount + 1;
    for (let i = 1; i <= s.episodeCount; i++) {
      const fileName = `${s.slug}-ep${String(i).padStart(2, "0")}.wav`;
      const rel = `/media/seed/${fileName}`;
      episodes.push({
        id: `ep-${s.slug}-${String(i).padStart(2, "0")}`,
        seriesId: row.id,
        seasonNumber: 1,
        order: i,
        title: `Episode ${i}`,
        titleSw: s.episodeTitlesSw?.[i - 1] ?? `Kipindi ${i}`,
        description: `Story part ${i} from authentic sources.`,
        descriptionSw: `Sehemu ya ${i} kulingana na mapokezi sahihi.`,
        durationSec: durationForEpisode(i + s.slug.length),
        mediaUrl: rel,
        mediaType: "AUDIO",
        isFree: i <= 3 || i % 2 === 1, // first episodes free, rest VIP
        views: Math.max(120, 1800 - i * 45),
        published: i < lockedFrom,
        authorName: "Ustadh Juma bin Salim",
        authorPhone: "+255713000111",
        createdAt: row.createdAt,
      });
    }
  });

  const gradKeys = ["teal", "forest", "gold", "deep", "olive", "emerald"];
  const adabCat = catBySlug["dua-na-adabu"] ?? categories[4] ?? categories[0];
  ADAB.forEach(([suffix, en, sw, ar], i) => {
    series.push({
      id: `ser-adabu-${suffix}`,
      slug: `adabu-${suffix}`,
      title: en,
      titleSw: sw,
      description: `Adab and etiquette of ${en.replace(/^Manners (of|toward) /i, "").toLowerCase()} — from the Qur'an and authentic Sunnah. (${ar})`,
      descriptionSw: `${sw} kwa mujibu wa Qur'an na Sunnah sahihi.`,
      categoryId: adabCat.id,
      coverGradient: gradKeys[i % gradKeys.length],
      image: `/media/series/adabu-${suffix}.jpg`,
      backdropImage: `/media/series/adabu-${suffix}.jpg`,
      featured: false,
      published: true,
      views: 890 + i * 85,
      likes: 80 + i * 12,
      seasonsCount: 1,
      rating: 4.9,
      tags: ["adabu", "maadili", "sunnah"],
      createdAt: nowIso(-(SERIES.length + i) * 43_200_000),
    });
  });

  const users: User[] = [
    {
      id: ADMIN_ID,
      name: "Admin Bashir",
      phone: "+255712345678",
      email: "admin@qisas.local",
      password: "admin1234",
      role: "ADMIN",
      language: "sw",
      subscriptionStatus: "ACTIVE",
      preferredQuality: "1080p",
      dataSaverEnabled: false,
      createdAt: nowIso(-45 * 86_400_000),
    },
    {
      id: DEMO_ID,
      name: "Kido Salim",
      phone: "+255754987654",
      email: "demo@qisas.local",
      password: "demo1234",
      role: "USER",
      language: "sw",
      subscriptionStatus: "ACTIVE",
      preferredQuality: "720p",
      dataSaverEnabled: true,
      createdAt: nowIso(-20 * 86_400_000),
    },
    {
      id: "user-fatma",
      name: "Fatma Zahra",
      phone: "+255788112233",
      email: "fatma@qisas.org",
      password: "user123",
      role: "USER",
      language: "sw",
      subscriptionStatus: "ACTIVE",
      preferredQuality: "auto",
      dataSaverEnabled: false,
      createdAt: nowIso(-12 * 86_400_000),
    },
    {
      id: "user-ali",
      name: "Ali Hassan",
      phone: "+255655443322",
      email: "ali@qisas.org",
      password: "user123",
      role: "USER",
      language: "sw",
      subscriptionStatus: "EXPIRED",
      preferredQuality: "auto",
      dataSaverEnabled: false,
      createdAt: nowIso(-8 * 86_400_000),
    },
    {
      id: "user-maryam",
      name: "Maryam Kassim",
      phone: "+255762009988",
      email: "maryam@qisas.org",
      password: "user123",
      role: "USER",
      language: "sw",
      subscriptionStatus: "FREE_TIER",
      preferredQuality: "auto",
      dataSaverEnabled: true,
      createdAt: nowIso(-3 * 86_400_000),
    },
  ];

  const subscriptions: Subscription[] = [
    {
      id: "sub-seed-1",
      userId: DEMO_ID,
      userName: "Kido Salim",
      userPhone: "+255754987654",
      plan: "MONTHLY",
      planNameSw: "Kifurushi cha Mwezi (Monthly VIP)",
      amountTzs: 3500,
      paymentMethod: "M-Pesa",
      referenceCode: "MP240891A92B",
      status: "ACTIVE",
      startDate: nowIso(-10 * 86_400_000),
      endDate: nowIso(20 * 86_400_000),
      createdAt: nowIso(-10 * 86_400_000),
    },
    {
      id: "sub-seed-2",
      userId: "user-fatma",
      userName: "Fatma Zahra",
      userPhone: "+255788112233",
      plan: "ANNUAL",
      planNameSw: "Kifurushi cha Mwaka (Annual VIP)",
      amountTzs: 25000,
      paymentMethod: "Tigo Pesa",
      referenceCode: "TP883199K2",
      status: "ACTIVE",
      startDate: nowIso(-5 * 86_400_000),
      endDate: nowIso(360 * 86_400_000),
      createdAt: nowIso(-5 * 86_400_000),
    },
    {
      id: "sub-seed-3",
      userId: ADMIN_ID,
      userName: "Admin Bashir",
      userPhone: "+255712345678",
      plan: "VIP_LIFETIME",
      planNameSw: "VIP wa Maisha (Lifetime VIP)",
      amountTzs: 100000,
      paymentMethod: "Admin Grant",
      referenceCode: "GRANT-LIFETIME-ROOT",
      status: "ACTIVE",
      startDate: nowIso(-45 * 86_400_000),
      endDate: nowIso(3600 * 86_400_000),
      createdAt: nowIso(-45 * 86_400_000),
    },
    {
      id: "sub-seed-4",
      userId: "user-ali",
      userName: "Ali Hassan",
      userPhone: "+255655443322",
      plan: "WEEKLY",
      planNameSw: "Kifurushi cha Wiki (Weekly VIP)",
      amountTzs: 1000,
      paymentMethod: "Airtel Money",
      referenceCode: "AIR4400192",
      status: "EXPIRED",
      startDate: nowIso(-16 * 86_400_000),
      endDate: nowIso(-9 * 86_400_000),
      createdAt: nowIso(-16 * 86_400_000),
    },
  ];

  const musa = series.find((s) => s.slug === "musa-as");
  const yusuf = series.find((s) => s.slug === "yusuf-as");
  const nuh = series.find((s) => s.slug === "nuh-as");
  const sira = series.find((s) => s.slug === "sira-makka");

  const musaEps = musa ? episodes.filter((e) => e.seriesId === musa.id).sort((a, b) => a.order - b.order) : [];
  const yusufEps = yusuf ? episodes.filter((e) => e.seriesId === yusuf.id).sort((a, b) => a.order - b.order) : [];

  const comments: Comment[] = [
    {
      id: "cmt-1",
      seriesId: musa?.id ?? "ser-musa-as",
      episodeId: musaEps[0]?.id,
      userId: DEMO_ID,
      userName: "Kido Salim",
      userPhone: "+255754987654",
      text: "MashaAllah, hadithi imeelezwa kwa ufasaha sana na Kiswahili kizuri mno!",
      likes: 18,
      createdAt: nowIso(-3 * 86_400_000),
    },
    {
      id: "cmt-2",
      seriesId: yusuf?.id ?? "ser-yusuf-as",
      episodeId: yusufEps[0]?.id,
      userId: "user-fatma",
      userName: "Fatma Zahra",
      userPhone: "+255788112233",
      text: "Ahsante sana kwa kazi nzuri. Hadithi ya Nabii Yusuf inafundisha subira kuu.",
      likes: 24,
      createdAt: nowIso(-2 * 86_400_000),
    },
    {
      id: "cmt-3",
      seriesId: musa?.id ?? "ser-musa-as",
      userId: "user-ali",
      userName: "Ali Hassan",
      userPhone: "+255655443322",
      text: "Tafadhali ongezeni sehemu zote za safari ya Musa na Khidhr haraka!",
      likes: 7,
      createdAt: nowIso(-1 * 86_400_000),
    },
    {
      id: "cmt-4",
      seriesId: musa?.id ?? "ser-musa-as",
      userId: "user-ester",
      userName: "ester mwatebela",
      userPhone: "+255711009988",
      text: "Maudhui mazuri sana, na sauti inasikika vizuri kabisa! Nimefurahia sana kuona historia hii.",
      likes: 12,
      createdAt: nowIso(-10 * 3600_000),
    },
    {
      id: "cmt-5",
      seriesId: musa?.id ?? "ser-musa-as",
      userId: ADMIN_ID,
      userName: "Qisas Team",
      userPhone: "+255712345678",
      text: "Ahsante sana Ester! Tunashukuru kwa maoni yako. Endelea kufurahia msururu mzima.",
      likes: 5,
      createdAt: nowIso(-8 * 3600_000),
      parentId: "cmt-4",
    },
  ];

  const communityUploads: CommunityUpload[] = [
    {
      id: "cu-1",
      userId: "user-fatma",
      userName: "Fatma Zahra",
      userPhone: "+255788112233",
      uploaderName: "Fatma Zahra",
      uploaderPhone: "+255788112233",
      authorName: "Ustadh Hamza Omar",
      authorPhone: "+255713445566",
      verifiedSpeaker: false,
      title: "Lessons from Surah Luqman",
      titleSw: "Mafunzo ya Surah Luqman kwa Watoto",
      category: "watoto",
      description: "A beautiful audio presentation explaining Luqman's golden advice to his son.",
      descriptionSw: "Darsa fupi yenye mafunzo mazito ya Luqman kwa mtoto wake kuhusu hekima na tauhidi.",
      mediaUrl: "/media/seed/wema-kwa-watoto-ep01.wav",
      mediaType: "AUDIO",
      durationSec: 145,
      likes: 42,
      views: 310,
      status: "APPROVED",
      createdAt: nowIso(-4 * 86_400_000),
    },
    {
      id: "cu-2",
      userId: "user-ali",
      userName: "Ali Hassan",
      userPhone: "+255655443322",
      uploaderName: "Ali Hassan",
      uploaderPhone: "+255655443322",
      authorName: "Sheikh Abdulrahman",
      authorPhone: "+255778990011",
      verifiedSpeaker: false,
      title: "Virtues of Seeking Islamic Knowledge",
      titleSw: "Fadhila za Kutafuta Elimu ya Dini",
      category: "wanazuoni",
      description: "Audio reminder on Islamic scholarship tradition in East Africa.",
      descriptionSw: "Mawaidha kuhusu safari za wanazuoni wa Kiswahili katika kusaka ilim.",
      mediaUrl: "/media/seed/imam-al-bukhari-ep01.wav",
      mediaType: "AUDIO",
      durationSec: 160,
      likes: 12,
      views: 89,
      status: "PENDING",
      createdAt: nowIso(-1 * 86_400_000),
    },
    {
      id: "cu-3",
      userId: ADMIN_ID,
      userName: "Admin Bashir",
      userPhone: "+255712345678",
      uploaderName: "Admin Bashir",
      authorName: "Qisas Studio",
      verifiedSpeaker: true,
      title: "Dua during Ramadan & Virtues",
      titleSw: "Dua za Ramadhani na Fadhila Zake",
      category: "dua-na-adabu",
      description: "Recitation of authentic supplications with Swahili commentary.",
      descriptionSw: "Dua sahihi kutoka Sunnah kwa ajili ya usiku wa Lailatul Qadr.",
      mediaUrl: "/media/seed/placeholder.wav",
      mediaType: "AUDIO",
      durationSec: 110,
      likes: 65,
      views: 520,
      status: "APPROVED",
      createdAt: nowIso(-7 * 86_400_000),
    },
  ];

  const notifications: AppNotification[] = [
    {
      id: "notif-1",
      targetUserId: "ALL",
      title: "Ramadan Special Series Live!",
      titleSw: "Mfululizo Maalum wa Ramadhani Umeanza!",
      message: "Listen to the newly published Seerah episodes and Duas for blessed nights.",
      messageSw: "Sikiliza vipindi vipya vya Sira ya Mtume (saw) na Dua za usiku wa cheo.",
      type: "SYSTEM",
      read: false,
      actionUrl: "/categories",
      createdAt: nowIso(-2 * 86_400_000),
    },
    {
      id: "notif-2",
      targetUserId: DEMO_ID,
      targetPhone: "+255754987654",
      title: "VIP Activated Successfully",
      titleSw: "Kifurushi Chako cha VIP Kimewezeshwa",
      message: "Thank you for subscribing to Monthly VIP. Enjoy unlimited ad-free access.",
      messageSw: "Asante kwa kujiunga na Kifurushi cha Mwezi. Furahia vipindi vyote bila kikomo.",
      type: "PAYMENT",
      read: true,
      actionUrl: "/profile",
      createdAt: nowIso(-10 * 86_400_000),
    },
    {
      id: "notif-3",
      targetUserId: "ALL",
      title: "New Prophet Musa (AS) Episode",
      titleSw: "Kipindi Kipya: Nabii Musa na Wamisri",
      message: "Episode 4 of Prophet Musa is now available in high quality audio.",
      messageSw: "Kipindi cha 4 cha Nabii Musa kimeshawekwa mtandaoni kwa sauti safi.",
      type: "NEW_EPISODE",
      read: false,
      actionUrl: "/series/musa-as",
      createdAt: nowIso(-1 * 86_400_000),
    },
  ];

  const progress: Progress[] = [];
  if (musaEps.length >= 4) {
    musaEps.slice(0, 3).forEach((e, i) => {
      progress.push({
        id: `prog-demo-musa-${i + 1}`,
        userId: DEMO_ID,
        episodeId: e.id,
        positionSec: 0,
        completed: true,
        updatedAt: nowIso(-(4 - i) * 3_600_000),
      });
    });
    progress.push({
      id: "prog-demo-musa-4",
      userId: DEMO_ID,
      episodeId: musaEps[3].id,
      positionSec: 42,
      completed: false,
      updatedAt: nowIso(-1_800_000),
    });
  }

  if (yusufEps.length >= 2) {
    progress.push({
      id: "prog-demo-yusuf-2",
      userId: DEMO_ID,
      episodeId: yusufEps[1].id,
      positionSec: 30,
      completed: false,
      updatedAt: nowIso(-3_600_000),
    });
  }

  const favorites: Favorite[] = [];
  if (nuh) favorites.push({ id: "fav-demo-nuh", userId: DEMO_ID, seriesId: nuh.id, createdAt: nowIso(-2 * 86_400_000) });
  if (sira) favorites.push({ id: "fav-demo-sira", userId: DEMO_ID, seriesId: sira.id, createdAt: nowIso(-86_400_000) });

  return {
    categories,
    series,
    episodes,
    users,
    subscriptions,
    comments,
    communityUploads,
    notifications,
    progress,
    favorites,
    videoJobs: [],
  };
}

function loadStore(): Store {
  try {
    const raw = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.categories && parsed.series && parsed.episodes) {
        // Ensure new collections exist in case of upgrade
        if (!parsed.subscriptions) parsed.subscriptions = [];
        if (!parsed.comments) parsed.comments = [];
        if (!parsed.communityUploads) parsed.communityUploads = [];
        if (!parsed.notifications) parsed.notifications = [];
        return parsed;
      }
    }
  } catch (e) {
    console.error("Failed to load store from localStorage", e);
  }
  const initial = buildInitialStore();
  saveStore(initial);
  return initial;
}

function saveStore(s: Store) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    }
  } catch (e) {
    console.error("Failed to save store to localStorage", e);
  }
}

let store: Store = loadStore();

const listeners = new Set<() => void>();

function notify() {
  saveStore(store);
  listeners.forEach((fn) => fn());
}

export function subscribeDb(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function resetStoreToSeed() {
  store = buildInitialStore();
  notify();
  return store;
}

function categoryOf(s: Series) {
  return store.categories.find((c) => c.id === s.categoryId) || store.categories[0];
}

export function toSeriesCard(s: Series): SeriesCard {
  const category = categoryOf(s);
  return {
    slug: s.slug,
    title: s.title,
    titleSw: s.titleSw,
    description: s.description,
    descriptionSw: s.descriptionSw,
    coverGradient: s.coverGradient,
    image: s.image || category?.image || null,
    featured: s.featured,
    episodeCount: store.episodes.filter((e) => e.seriesId === s.id).length,
    favoriteCount: store.favorites.filter((f) => f.seriesId === s.id).length,
    categoryName: category?.name ?? "General",
    categoryNameSw: category?.nameSw ?? "Jumla",
    categorySlug: category?.slug ?? "general",
    views: s.views,
    likes: s.likes,
  };
}

export function normalizePhone(raw: string): string {
  const clean = raw.trim();
  const digits = clean.replace(/\D/g, "");
  if (digits.startsWith("255") && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith("0") && digits.length === 10) {
    return `+255${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+255${digits}`;
  }
  if (clean.startsWith("+")) return clean;
  return clean;
}

export function matchPhone(storedPhone?: string, queryPhone?: string): boolean {
  if (!storedPhone || !queryPhone) return false;
  const sDigits = storedPhone.replace(/\D/g, "");
  const qDigits = queryPhone.replace(/\D/g, "");
  if (!sDigits || !qDigits) return false;
  if (sDigits === qDigits) return true;
  // Match last 9 digits (local Tanzanian phone without prefix 0 or 255)
  if (sDigits.length >= 9 && qDigits.length >= 9) {
    return sDigits.slice(-9) === qDigits.slice(-9);
  }
  return false;
}

export const db = {
  get store() {
    return store;
  },

  categories: {
    findMany() {
      return [...store.categories].sort((a, b) => a.order - b.order || a.nameSw.localeCompare(b.nameSw));
    },
    findById(id: string) {
      return store.categories.find((c) => c.id === id) ?? null;
    },
    findBySlug(slug: string) {
      return store.categories.find((c) => c.slug === slug) ?? null;
    },
    count() {
      return store.categories.length;
    },
    create(data: Omit<Category, "id">) {
      const row: Category = { ...data, id: nid("cat") };
      store.categories.push(row);
      notify();
      return row;
    },
    updateBySlug(slug: string, data: Partial<Category>) {
      const row = store.categories.find((c) => c.slug === slug);
      if (row) {
        Object.assign(row, data);
        notify();
      }
      return row ?? null;
    },
    delete(id: string) {
      const idx = store.categories.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      const [deleted] = store.categories.splice(idx, 1);
      notify();
      return deleted;
    },
    seriesCount(id: string) {
      return store.series.filter((s) => s.categoryId === id && s.published).length;
    },
  },

  series: {
    findMany(opts?: {
      published?: boolean;
      categorySlug?: string;
      featured?: boolean;
      q?: string;
      tab?: string;
      take?: number;
    }) {
      let rows = [...store.series];
      if (opts?.published) rows = rows.filter((s) => s.published);
      if (opts?.categorySlug) {
        const cat = store.categories.find((c) => c.slug === opts.categorySlug);
        rows = cat ? rows.filter((s) => s.categoryId === cat.id) : [];
      }
      if (opts?.featured) rows = rows.filter((s) => s.featured);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (s) =>
            s.title.toLowerCase().includes(q) ||
            s.titleSw.toLowerCase().includes(q) ||
            s.description.toLowerCase().includes(q) ||
            s.descriptionSw.toLowerCase().includes(q),
        );
      }
      if (opts?.tab === "new") {
        rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
      } else {
        rows.sort((a, b) => {
          const fav = (id: string) => store.favorites.filter((f) => f.seriesId === id).length;
          return fav(b.id) - fav(a.id) || Number(b.featured) - Number(a.featured) || +new Date(b.createdAt) - +new Date(a.createdAt);
        });
      }
      if (opts?.take) rows = rows.slice(0, opts.take);
      return rows;
    },
    findById(id: string) {
      return store.series.find((s) => s.id === id) ?? null;
    },
    findBySlug(slug: string) {
      return store.series.find((s) => s.slug === slug) ?? null;
    },
    create(
      data: Omit<Series, "id" | "createdAt" | "views" | "seasonsCount"> &
        Partial<Pick<Series, "views" | "seasonsCount" | "createdAt">>
    ) {
      const row: Series = {
        ...data,
        id: nid("ser"),
        views: data.views ?? 0,
        likes: data.likes ?? 0,
        seasonsCount: data.seasonsCount ?? 1,
        createdAt: data.createdAt ?? nowIso(),
      };
      store.series.push(row);
      notify();
      return row;
    },
    updateBySlug(slug: string, data: Partial<Series>) {
      const row = store.series.find((s) => s.slug === slug);
      if (row) {
        Object.assign(row, data);
        notify();
      }
      return row ?? null;
    },
    toggleFeatured(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.featured = !row.featured;
        notify();
        return row.featured;
      }
      return false;
    },
    togglePublished(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.published = !row.published;
        notify();
        return row.published;
      }
      return false;
    },
    incrementViews(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.views = (row.views || 0) + 1;
        notify();
      }
    },
    delete(id: string) {
      const idx = store.series.findIndex((s) => s.id === id);
      if (idx < 0) return null;
      const [deleted] = store.series.splice(idx, 1);
      // Cascade delete episodes
      const epIds = store.episodes.filter((e) => e.seriesId === id).map((e) => e.id);
      store.episodes = store.episodes.filter((e) => e.seriesId !== id);
      store.progress = store.progress.filter((p) => !epIds.includes(p.episodeId));
      store.favorites = store.favorites.filter((f) => f.seriesId !== id);
      store.comments = store.comments.filter((c) => c.seriesId !== id);
      store.videoJobs = store.videoJobs.filter((j) => j.seriesId !== id);
      notify();
      return deleted;
    },
    toggleLike(id: string) {
      const row = store.series.find((s) => s.id === id);
      if (row) {
        row.likes = (row.likes || 0) + 1;
        notify();
        return row.likes;
      }
      return 0;
    },
    episodeCount(id: string) {
      return store.episodes.filter((e) => e.seriesId === id).length;
    },
  },

  episodes: {
    findMany(opts?: { seriesId?: string; isFree?: boolean; q?: string }) {
      let rows = [...store.episodes];
      if (opts?.seriesId) rows = rows.filter((e) => e.seriesId === opts.seriesId);
      if (typeof opts?.isFree === "boolean") rows = rows.filter((e) => e.isFree === opts.isFree);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (e) =>
            e.title.toLowerCase().includes(q) ||
            e.titleSw.toLowerCase().includes(q) ||
            (e.authorName && e.authorName.toLowerCase().includes(q)),
        );
      }
      return rows.sort((a, b) => a.order - b.order);
    },
    findById(id: string) {
      return store.episodes.find((e) => e.id === id) ?? null;
    },
    findBySeries(seriesId: string) {
      return store.episodes.filter((e) => e.seriesId === seriesId).sort((a, b) => a.order - b.order);
    },
    findBySeriesOrder(seriesId: string, order: number) {
      return store.episodes.find((e) => e.seriesId === seriesId && e.order === order) ?? null;
    },
    count() {
      return store.episodes.length;
    },
    create(
      data: Omit<Episode, "id" | "createdAt" | "views" | "seasonNumber" | "isFree"> &
        Partial<Pick<Episode, "views" | "seasonNumber" | "isFree" | "createdAt">>
    ) {
      const row: Episode = {
        ...data,
        id: nid("ep"),
        views: data.views ?? 0,
        seasonNumber: data.seasonNumber ?? 1,
        isFree: typeof data.isFree === "boolean" ? data.isFree : true,
        createdAt: data.createdAt ?? nowIso(),
      };
      store.episodes.push(row);
      notify();
      return row;
    },
    update(id: string, data: Partial<Episode>) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        Object.assign(row, data);
        notify();
      }
      return row ?? null;
    },
    toggleFree(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        row.isFree = !row.isFree;
        notify();
        return row.isFree;
      }
      return false;
    },
    togglePublished(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        row.published = !row.published;
        notify();
        return row.published;
      }
      return false;
    },
    incrementViews(id: string) {
      const row = store.episodes.find((e) => e.id === id);
      if (row) {
        row.views = (row.views || 0) + 1;
        notify();
      }
    },
    delete(id: string) {
      const idx = store.episodes.findIndex((e) => e.id === id);
      if (idx < 0) return null;
      const [row] = store.episodes.splice(idx, 1);
      store.progress = store.progress.filter((p) => p.episodeId !== id);
      store.comments = store.comments.filter((c) => c.episodeId !== id);
      notify();
      return row;
    },
  },

  users: {
    findMany(opts?: { q?: string; role?: Role; subscriptionStatus?: string }) {
      let rows = [...store.users];
      if (opts?.role) rows = rows.filter((u) => u.role === opts.role);
      if (opts?.subscriptionStatus) rows = rows.filter((u) => u.subscriptionStatus === opts.subscriptionStatus);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.phone && u.phone.includes(q)),
        );
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findById(id: string) {
      return store.users.find((u) => u.id === id) ?? null;
    },
    findByEmail(email: string) {
      return store.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim()) ?? null;
    },
    findByPhone(phone: string) {
      const clean = phone.trim();
      return store.users.find((u) => matchPhone(u.phone, clean)) ?? null;
    },
    count() {
      return store.users.length;
    },
    create(
      data: Omit<User, "id" | "createdAt" | "phone" | "language"> & {
        phone?: string;
        language?: string;
        createdAt?: string;
      }
    ) {
      const row: User = {
        ...data,
        id: nid("user"),
        email: data.email.toLowerCase().trim(),
        phone: (data.phone ?? "+255700000000").trim(),
        role: data.role || "USER",
        language: data.language || "sw",
        subscriptionStatus: data.subscriptionStatus || "FREE_TIER",
        createdAt: data.createdAt ?? nowIso(),
      };
      store.users.push(row);
      notify();
      return row;
    },
    update(id: string, data: Partial<User>) {
      const user = store.users.find((u) => u.id === id);
      if (user) {
        Object.assign(user, data);
        notify();
      }
      return user ?? null;
    },
    updateRole(id: string, role: Role) {
      const user = store.users.find((u) => u.id === id);
      if (user) {
        user.role = role;
        notify();
      }
      return user ?? null;
    },
    delete(id: string) {
      const idx = store.users.findIndex((u) => u.id === id);
      if (idx < 0) return null;
      const [row] = store.users.splice(idx, 1);
      store.subscriptions = store.subscriptions.filter((s) => s.userId !== id);
      store.progress = store.progress.filter((p) => p.userId !== id);
      store.favorites = store.favorites.filter((f) => f.userId !== id);
      notify();
      return row;
    },
  },

  subscriptions: {
    findMany(opts?: { status?: SubscriptionStatus; plan?: SubscriptionPlan; q?: string }) {
      let rows = [...store.subscriptions];
      if (opts?.status) rows = rows.filter((s) => s.status === opts.status);
      if (opts?.plan) rows = rows.filter((s) => s.plan === opts.plan);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (s) =>
            s.userName.toLowerCase().includes(q) ||
            s.userPhone.includes(q) ||
            s.referenceCode.toLowerCase().includes(q),
        );
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findById(id: string) {
      return store.subscriptions.find((s) => s.id === id) ?? null;
    },
    grantVIP(userId: string, plan: SubscriptionPlan) {
      const user = store.users.find((u) => u.id === userId);
      if (!user) return null;
      const planConfigs = {
        WEEKLY: { days: 7, amountTzs: 1000, planNameSw: "Kifurushi cha Wiki (Weekly VIP)" },
        MONTHLY: { days: 30, amountTzs: 3500, planNameSw: "Kifurushi cha Mwezi (Monthly VIP)" },
        ANNUAL: { days: 365, amountTzs: 25000, planNameSw: "Kifurushi cha Mwaka (Annual VIP)" },
        VIP_LIFETIME: { days: 3650, amountTzs: 100000, planNameSw: "VIP wa Maisha (Lifetime VIP)" },
      };
      const cfg = planConfigs[plan] ?? planConfigs.MONTHLY;
      const start = new Date();
      const end = new Date(start.getTime() + cfg.days * 86_400_000);

      const sub: Subscription = {
        id: nid("sub"),
        userId: user.id,
        userName: user.name,
        userPhone: user.phone || "+255700000000",
        plan,
        planNameSw: cfg.planNameSw,
        amountTzs: cfg.amountTzs,
        paymentMethod: "Admin Grant",
        referenceCode: `GRANT-${Date.now().toString(36).toUpperCase()}`,
        status: "ACTIVE",
        startDate: start.toISOString(),
        endDate: end.toISOString(),
        createdAt: start.toISOString(),
      };
      store.subscriptions.unshift(sub);
      user.subscriptionStatus = "ACTIVE";
      notify();
      return sub;
    },
    updateStatus(id: string, status: SubscriptionStatus) {
      const sub = store.subscriptions.find((s) => s.id === id);
      if (sub) {
        sub.status = status;
        const user = store.users.find((u) => u.id === sub.userId);
        if (user) {
          if (status === "ACTIVE") user.subscriptionStatus = "ACTIVE";
          else if (status === "CANCELLED" || status === "EXPIRED") {
            const hasOtherActive = store.subscriptions.some(
              (o) => o.userId === user.id && o.id !== id && o.status === "ACTIVE",
            );
            if (!hasOtherActive) user.subscriptionStatus = "EXPIRED";
          }
        }
        notify();
      }
      return sub ?? null;
    },
    delete(id: string) {
      const idx = store.subscriptions.findIndex((s) => s.id === id);
      if (idx < 0) return null;
      const [deleted] = store.subscriptions.splice(idx, 1);
      notify();
      return deleted;
    },
    totalRevenue() {
      return store.subscriptions.reduce((sum, s) => sum + (s.amountTzs || 0), 0);
    },
    activeCount() {
      return store.subscriptions.filter((s) => s.status === "ACTIVE").length;
    },
  },

  comments: {
    findMany(opts?: { seriesId?: string; episodeId?: string; parentId?: string | null; q?: string; includeHidden?: boolean }) {
      let rows = [...store.comments];
      if (opts?.seriesId) rows = rows.filter((c) => c.seriesId === opts.seriesId);
      if (opts?.episodeId) rows = rows.filter((c) => c.episodeId === opts.episodeId);
      if (opts?.parentId !== undefined) {
        if (opts.parentId === null) {
          rows = rows.filter((c) => !c.parentId);
        } else {
          rows = rows.filter((c) => c.parentId === opts.parentId);
        }
      }
      if (!opts?.includeHidden) rows = rows.filter((c) => !c.hidden);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter((c) => c.text.toLowerCase().includes(q) || c.userName.toLowerCase().includes(q));
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    create(data: Omit<Comment, "id" | "createdAt">) {
      const row: Comment = {
        ...data,
        id: nid("cmt"),
        likes: data.likes ?? 0,
        createdAt: nowIso(),
      };
      store.comments.unshift(row);
      notify();
      return row;
    },
    toggleLike(id: string) {
      const c = store.comments.find((item) => item.id === id);
      if (c) {
        c.likes = (c.likes || 0) + 1;
        notify();
        return c.likes;
      }
      return 0;
    },
    toggleHide(id: string) {
      const c = store.comments.find((item) => item.id === id);
      if (c) {
        c.hidden = !c.hidden;
        notify();
        return c.hidden;
      }
      return false;
    },
    delete(id: string) {
      const idx = store.comments.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      const [deleted] = store.comments.splice(idx, 1);
      notify();
      return deleted;
    },
  },

  communityUploads: {
    findMany(opts?: { status?: "APPROVED" | "PENDING" | "REJECTED"; q?: string }) {
      let rows = [...store.communityUploads];
      if (opts?.status) rows = rows.filter((c) => c.status === opts.status);
      if (opts?.q) {
        const q = opts.q.toLowerCase();
        rows = rows.filter(
          (c) =>
            c.title.toLowerCase().includes(q) ||
            c.titleSw.toLowerCase().includes(q) ||
            (c.uploaderName && c.uploaderName.toLowerCase().includes(q)),
        );
      }
      return rows.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findById(id: string) {
      return store.communityUploads.find((c) => c.id === id) ?? null;
    },
    create(data: Omit<CommunityUpload, "id" | "createdAt" | "likes">) {
      const row: CommunityUpload = {
        ...data,
        id: nid("cu"),
        likes: 0,
        views: 0,
        status: data.status || "PENDING",
        createdAt: nowIso(),
      };
      store.communityUploads.unshift(row);
      notify();
      return row;
    },
    updateStatus(id: string, status: "APPROVED" | "PENDING" | "REJECTED", notes?: string) {
      const cu = store.communityUploads.find((c) => c.id === id);
      if (cu) {
        cu.status = status;
        if (notes) cu.moderationNotes = notes;
        notify();
      }
      return cu ?? null;
    },
    delete(id: string) {
      const idx = store.communityUploads.findIndex((c) => c.id === id);
      if (idx < 0) return null;
      const [deleted] = store.communityUploads.splice(idx, 1);
      notify();
      return deleted;
    },
  },

  notifications: {
    findMany(opts?: { userId?: string; userPhone?: string }) {
      return [...store.notifications].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    findForUser(userId?: string, userPhone?: string) {
      return store.notifications
        .filter((n) => {
          if (n.targetUserId === "ALL") return true;
          if (userId && n.targetUserId === userId) return true;
          if (userPhone && n.targetPhone === userPhone) return true;
          return false;
        })
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    unreadCount(userId?: string, userPhone?: string) {
      return db.notifications.findForUser(userId, userPhone).filter((n) => !n.read).length;
    },
    create(data: Omit<AppNotification, "id" | "createdAt" | "read">) {
      const row: AppNotification = {
        ...data,
        id: nid("notif"),
        read: false,
        createdAt: nowIso(),
      };
      store.notifications.unshift(row);
      notify();
      return row;
    },
    blast(data: {
      title: string;
      titleSw: string;
      message: string;
      messageSw: string;
      type: AppNotification["type"];
      targetUserId?: string | "ALL";
      targetPhone?: string;
      actionUrl?: string;
    }) {
      const row: AppNotification = {
        ...data,
        id: nid("notif"),
        targetUserId: data.targetUserId || "ALL",
        read: false,
        createdAt: nowIso(),
      };
      store.notifications.unshift(row);
      notify();
      return row;
    },
    markAsRead(id: string) {
      const n = store.notifications.find((item) => item.id === id);
      if (n) {
        n.read = true;
        notify();
      }
      return n ?? null;
    },
    markAllAsRead(userId?: string) {
      store.notifications.forEach((n) => {
        if (n.targetUserId === "ALL" || (userId && n.targetUserId === userId)) {
          n.read = true;
        }
      });
      notify();
    },
    delete(id: string) {
      const idx = store.notifications.findIndex((n) => n.id === id);
      if (idx < 0) return null;
      const [deleted] = store.notifications.splice(idx, 1);
      notify();
      return deleted;
    },
  },

  progress: {
    find(userId: string, episodeId: string) {
      return store.progress.find((p) => p.userId === userId && p.episodeId === episodeId) ?? null;
    },
    findMany(userId: string, opts?: { completed?: boolean; seriesId?: string }) {
      let rows = store.progress.filter((p) => p.userId === userId);
      if (typeof opts?.completed === "boolean") rows = rows.filter((p) => p.completed === opts.completed);
      if (opts?.seriesId) {
        const ids = new Set(store.episodes.filter((e) => e.seriesId === opts.seriesId).map((e) => e.id));
        rows = rows.filter((p) => ids.has(p.episodeId));
      }
      return rows.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    },
    countCompleted(userId: string) {
      return store.progress.filter((p) => p.userId === userId && p.completed).length;
    },
    countForEpisode(episodeId: string) {
      return store.progress.filter((p) => p.episodeId === episodeId).length;
    },
    upsert(userId: string, episodeId: string, positionSec: number, completed: boolean) {
      const existing = store.progress.find((p) => p.userId === userId && p.episodeId === episodeId);
      if (existing) {
        existing.positionSec = positionSec;
        existing.completed = completed;
        existing.updatedAt = nowIso();
        notify();
        return existing;
      }
      const row: Progress = {
        id: nid("prog"),
        userId,
        episodeId,
        positionSec,
        completed,
        updatedAt: nowIso(),
      };
      store.progress.push(row);
      notify();
      return row;
    },
  },

  favorites: {
    find(userId: string, seriesId: string) {
      return store.favorites.find((f) => f.userId === userId && f.seriesId === seriesId) ?? null;
    },
    findMany(userId: string) {
      return store.favorites
        .filter((f) => f.userId === userId)
        .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    },
    count(userId: string) {
      return store.favorites.filter((f) => f.userId === userId).length;
    },
    toggle(userId: string, seriesId: string) {
      const existing = store.favorites.find((f) => f.userId === userId && f.seriesId === seriesId);
      if (existing) {
        store.favorites = store.favorites.filter((f) => f.id !== existing.id);
        notify();
        return false;
      }
      store.favorites.push({ id: nid("fav"), userId, seriesId, createdAt: nowIso() });
      notify();
      return true;
    },
  },

  videoJobs: {
    findMany() {
      return [...store.videoJobs].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
    },
    findById(id: string) {
      return store.videoJobs.find((j) => j.id === id) ?? null;
    },
    findByEpisodeId(episodeId: string) {
      return store.videoJobs.find((j) => j.episodeId === episodeId) ?? null;
    },
    create(
      data: Partial<VideoJob> & {
        episodeId?: string | null;
        episodeTitle?: string;
        seriesId?: string;
        titleSw?: string;
        titleEn?: string;
      }
    ) {
      const ts = nowIso();
      const row: VideoJob = {
        id: data.id ?? nid("job"),
        seriesId: data.seriesId ?? "series-prophets",
        episodeId: data.episodeId ?? null,
        episodeTitle: data.episodeTitle ?? "Untitled Episode",
        format: data.format ?? "VERTICAL_9_16",
        engine: data.engine ?? "remotion",
        progress: data.progress ?? 0,
        currentStep: data.currentStep ?? "Queued",
        status: data.status ?? "QUEUED",
        brief: data.brief ?? "",
        titleSw: data.titleSw ?? data.episodeTitle ?? "Video Render",
        titleEn: data.titleEn ?? "Video Render",
        storyboard: data.storyboard ?? [],
        scriptProvider: data.scriptProvider ?? "gemini-flash",
        ttsProvider: data.ttsProvider ?? "elevenlabs",
        voice: data.voice ?? "sw-TZ-standard",
        outputUrl: data.outputUrl ?? null,
        posterUrl: data.posterUrl ?? null,
        durationSec: data.durationSec ?? 120,
        logs: data.logs ?? "",
        error: data.error ?? null,
        createdById: data.createdById ?? null,
        createdAt: ts,
        updatedAt: ts,
      };
      store.videoJobs.push(row);
      notify();
      return row;
    },
    updateProgress(
      id: string,
      progress: number,
      status?: VideoJob["status"],
      currentStep?: string,
      outputUrl?: string
    ) {
      const row = store.videoJobs.find((j) => j.id === id);
      if (!row) return null;
      if (status) row.status = status;
      row.progress = progress;
      if (currentStep) row.currentStep = currentStep;
      if (outputUrl) row.outputUrl = outputUrl;
      row.updatedAt = nowIso();
      notify();
      return row;
    },
    update(id: string, data: Partial<VideoJob>) {
      const row = store.videoJobs.find((j) => j.id === id);
      if (!row) return null;
      Object.assign(row, data, { updatedAt: nowIso() });
      notify();
      return row;
    },
    delete(id: string) {
      const idx = store.videoJobs.findIndex((j) => j.id === id);
      if (idx < 0) return null;
      const [row] = store.videoJobs.splice(idx, 1);
      notify();
      return row;
    },
  },
};
