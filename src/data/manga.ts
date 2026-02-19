export interface Manga {
  id: string;
  title: string;
  cover: string;
  description: string;
  author: string;
  genres: string[];
  rating: number;
  chapters: number;
  status: "Ongoing" | "Completed";
  year: number;
  views: string;
}

export interface Chapter {
  id: number;
  title: string;
  pages: string[];
  date: string;
}

export const mangaList: Manga[] = [
  {
    id: "solo-leveling",
    title: "Solo Leveling",
    cover: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=600&fit=crop",
    description: "In a world where hunters — humans who possess magical abilities — must battle deadly monsters to protect the human race from certain annihilation, a notoriously weak hunter named Sung Jinwoo finds himself in a seemingly endless struggle for survival.",
    author: "Chugong",
    genres: ["Action", "Fantasy", "Adventure"],
    rating: 4.9,
    chapters: 179,
    status: "Completed",
    year: 2018,
    views: "12.5M",
  },
  {
    id: "one-punch-man",
    title: "One Punch Man",
    cover: "https://images.unsplash.com/photo-1613376023733-0a73315d9b06?w=400&h=600&fit=crop",
    description: "The seemingly ordinary and unimpressive Saitama has a rather unique hobby: being a hero. In order to pursue his childhood dream, he trained relentlessly for three years until his hair fell out.",
    author: "ONE / Yusuke Murata",
    genres: ["Action", "Comedy", "Superhero"],
    rating: 4.8,
    chapters: 245,
    status: "Ongoing",
    year: 2012,
    views: "9.8M",
  },
  {
    id: "demon-slayer",
    title: "Demon Slayer",
    cover: "https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=600&fit=crop",
    description: "Tanjiro sets out on the path of the Demon Slayer to save his sister and avenge his family! In Taisho-era Japan, kindhearted Tanjiro Kamado makes a living selling charcoal.",
    author: "Koyoharu Gotouge",
    genres: ["Action", "Supernatural", "Drama"],
    rating: 4.7,
    chapters: 205,
    status: "Completed",
    year: 2016,
    views: "15.2M",
  },
  {
    id: "jujutsu-kaisen",
    title: "Jujutsu Kaisen",
    cover: "https://images.unsplash.com/photo-1560807707-8cc77767d783?w=400&h=600&fit=crop",
    description: "Yuji Itadori is a boy with tremendous physical strength, though he lives a completely ordinary high school life. One day, to save a classmate who has been attacked by curses, he eats the finger of Ryomen Sukuna.",
    author: "Gege Akutami",
    genres: ["Action", "Dark Fantasy", "Supernatural"],
    rating: 4.8,
    chapters: 271,
    status: "Completed",
    year: 2018,
    views: "11.3M",
  },
  {
    id: "chainsaw-man",
    title: "Chainsaw Man",
    cover: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=400&h=600&fit=crop",
    description: "Denji has a simple dream — to live a happy and peaceful life, spending time with a girl he likes. This is a far cry from reality, however, as Denji is forced by the yakuza into killing devils.",
    author: "Tatsuki Fujimoto",
    genres: ["Action", "Dark Fantasy", "Horror"],
    rating: 4.6,
    chapters: 180,
    status: "Ongoing",
    year: 2018,
    views: "8.1M",
  },
  {
    id: "attack-on-titan",
    title: "Attack on Titan",
    cover: "https://images.unsplash.com/photo-1541562232579-512a21360020?w=400&h=600&fit=crop",
    description: "Humanity lives inside cities surrounded by enormous walls due to the Titans, gigantic humanoid beings who devour humans seemingly without reason.",
    author: "Hajime Isayama",
    genres: ["Action", "Dark Fantasy", "Post-apocalyptic"],
    rating: 4.9,
    chapters: 139,
    status: "Completed",
    year: 2009,
    views: "20.1M",
  },
  {
    id: "my-hero-academia",
    title: "My Hero Academia",
    cover: "https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400&h=600&fit=crop",
    description: "In a world where most of the population has gained superpowers called 'Quirks', Izuku Midoriya dreams of becoming a superhero despite being born without powers.",
    author: "Kohei Horikoshi",
    genres: ["Action", "Superhero", "School"],
    rating: 4.5,
    chapters: 430,
    status: "Completed",
    year: 2014,
    views: "14.7M",
  },
  {
    id: "tower-of-god",
    title: "Tower of God",
    cover: "https://images.unsplash.com/photo-1519638399535-1b036603ac77?w=400&h=600&fit=crop",
    description: "What do you desire? Money and wealth? Honor and pride? Authority and power? Revenge? Or something that transcends them all? Whatever you desire — it's here.",
    author: "SIU",
    genres: ["Action", "Fantasy", "Mystery"],
    rating: 4.7,
    chapters: 580,
    status: "Ongoing",
    year: 2010,
    views: "7.4M",
  },
];

export const getChapters = (mangaId: string): Chapter[] => {
  const manga = mangaList.find((m) => m.id === mangaId);
  if (!manga) return [];
  return Array.from({ length: Math.min(manga.chapters, 30) }, (_, i) => ({
    id: i + 1,
    title: `Chapter ${i + 1}`,
    pages: Array.from({ length: 8 }, (_, j) =>
      `https://images.unsplash.com/photo-${1550000000000 + i * 1000 + j * 100}?w=800&h=1200&fit=crop`
    ),
    date: new Date(2024, 0, 30 - i).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
  }));
};

export const genres = [
  "All", "Action", "Fantasy", "Adventure", "Comedy", "Superhero",
  "Supernatural", "Drama", "Dark Fantasy", "Horror", "Post-apocalyptic",
  "School", "Mystery",
];
