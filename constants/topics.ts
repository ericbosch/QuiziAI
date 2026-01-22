/**
 * Curated topics organized by categories for quick play
 */

export type Category = "history" | "science" | "cinema" | "geography" | "sports" | "literature" | "art" | "music";

export interface CategoryInfo {
  id: Category;
  name: string;
  emoji: string;
  topics: string[];
}

export const CATEGORIES: Record<Category, CategoryInfo> = {
  history: {
    id: "history",
    name: "Historia",
    emoji: "🏛️",
    topics: [
      "Segunda Guerra Mundial",
      "Revolución Francesa",
      "Imperio Romano",
      "Antiguo Egipto",
      "Renacimiento",
      "Revolución Industrial",
      "Guerra Fría",
      "Caída del Muro de Berlín",
      "Descubrimiento de América",
      "Imperio Bizantino",
      "Guerra Civil Española",
      "Revolución Rusa",
      "Edad Media",
      "Antigua Grecia",
      "Primera Guerra Mundial",
    ],
  },
  science: {
    id: "science",
    name: "Ciencia",
    emoji: "🔬",
    topics: [
      "Albert Einstein",
      "Teoría de la Relatividad",
      "ADN",
      "Fotosíntesis",
      "Sistema Solar",
      "Agujeros Negros",
      "Evolución",
      "Tabla Periódica",
      "Newton",
      "Darwin",
      "Marie Curie",
      "Galileo",
      "Tesla",
      "Hawking",
      "ADN",
    ],
  },
  cinema: {
    id: "cinema",
    name: "Cine",
    emoji: "🎬",
    topics: [
      "El Padrino",
      "Pulp Fiction",
      "Titanic",
      "Matrix",
      "Star Wars",
      "El Señor de los Anillos",
      "Inception",
      "Forrest Gump",
      "Gladiator",
      "Casablanca",
      "Blade Runner",
      "2001: A Space Odyssey",
      "Apocalypse Now",
      "Goodfellas",
      "The Godfather",
    ],
  },
  geography: {
    id: "geography",
    name: "Geografía",
    emoji: "🌍",
    topics: [
      "París",
      "Río Amazonas",
      "Monte Everest",
      "Desierto del Sahara",
      "Océano Pacífico",
      "Antártida",
      "Gran Cañón",
      "Machu Picchu",
      "Islandia",
      "Japón",
      "Australia",
      "Brasil",
      "Rusia",
      "Canadá",
      "India",
    ],
  },
  sports: {
    id: "sports",
    name: "Deportes",
    emoji: "⚽",
    topics: [
      "Fútbol",
      "Lionel Messi",
      "Cristiano Ronaldo",
      "Copa del Mundo",
      "Juegos Olímpicos",
      "Tennis",
      "Basketball",
      "Michael Jordan",
      "Usain Bolt",
      "Fórmula 1",
      "Lewis Hamilton",
      "Rafael Nadal",
      "Serena Williams",
      "Pelé",
      "Maradona",
    ],
  },
  literature: {
    id: "literature",
    name: "Literatura",
    emoji: "📚",
    topics: [
      "Don Quijote",
      "Cien años de soledad",
      "Gabriel García Márquez",
      "Miguel de Cervantes",
      "Jorge Luis Borges",
      "Pablo Neruda",
      "Shakespeare",
      "Mario Vargas Llosa",
      "Isabel Allende",
      "Jorge Luis Borges",
      "Federico García Lorca",
      "Octavio Paz",
      "Julio Cortázar",
      "Ernest Hemingway",
      "Franz Kafka",
    ],
  },
  art: {
    id: "art",
    name: "Arte",
    emoji: "🎨",
    topics: [
      "Pablo Picasso",
      "Leonardo da Vinci",
      "Vincent van Gogh",
      "Salvador Dalí",
      "Frida Kahlo",
      "Diego Velázquez",
      "Goya",
      "Michelangelo",
      "Monet",
      "Dalí",
      "Rembrandt",
      "Van Gogh",
      "Museo del Prado",
      "Mona Lisa",
      "Guernica",
    ],
  },
  music: {
    id: "music",
    name: "Música",
    emoji: "🎵",
    topics: [
      "The Beatles",
      "Mozart",
      "Beethoven",
      "Queen",
      "Bob Dylan",
      "Pink Floyd",
      "Led Zeppelin",
      "Bach",
      "Chopin",
      "The Rolling Stones",
      "David Bowie",
      "Jimi Hendrix",
      "Opera",
      "Jazz",
      "Rock and Roll",
    ],
  },
};

/**
 * Get all categories as an array
 */
export function getAllCategories(): CategoryInfo[] {
  return Object.values(CATEGORIES);
}

/**
 * Get a random topic from a specific category
 */
export function getRandomTopicFromCategory(category: Category): string {
  const categoryInfo = CATEGORIES[category];
  if (!categoryInfo || categoryInfo.topics.length === 0) {
    throw new Error(`Category ${category} not found or has no topics`);
  }
  const randomIndex = Math.floor(Math.random() * categoryInfo.topics.length);
  return categoryInfo.topics[randomIndex];
}

/**
 * Get a random topic from any category
 */
export function getRandomTopicFromAnyCategory(): { topic: string; category: CategoryInfo } {
  const categories = getAllCategories();
  const randomCategoryIndex = Math.floor(Math.random() * categories.length);
  const randomCategory = categories[randomCategoryIndex];
  const topic = getRandomTopicFromCategory(randomCategory.id);
  return { topic, category: randomCategory };
}

/**
 * Get category info by ID
 */
export function getCategoryById(categoryId: Category): CategoryInfo {
  return CATEGORIES[categoryId];
}
