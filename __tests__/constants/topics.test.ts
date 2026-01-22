import {
  getAllCategories,
  getRandomTopicFromCategory,
  getRandomTopicFromAnyCategory,
  getCategoryById,
  CATEGORIES,
  type Category,
} from "@/constants/topics";

describe("Topics Constants", () => {
  describe("getAllCategories", () => {
    it("should return all categories", () => {
      const categories = getAllCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.every((cat) => cat.id && cat.name && cat.emoji && cat.topics.length > 0)).toBe(true);
    });

    it("should return categories with expected structure", () => {
      const categories = getAllCategories();
      categories.forEach((category) => {
        expect(category).toHaveProperty("id");
        expect(category).toHaveProperty("name");
        expect(category).toHaveProperty("emoji");
        expect(category).toHaveProperty("topics");
        expect(Array.isArray(category.topics)).toBe(true);
        expect(category.topics.length).toBeGreaterThan(0);
      });
    });
  });

  describe("getCategoryById", () => {
    it("should return category for valid ID", () => {
      const category = getCategoryById("history");
      expect(category).toBeDefined();
      expect(category.id).toBe("history");
      expect(category.name).toBe("Historia");
    });

    it("should return category for all valid category IDs", () => {
      const validCategories: Category[] = ["history", "science", "cinema", "geography", "sports", "literature", "art", "music"];
      validCategories.forEach((categoryId) => {
        const category = getCategoryById(categoryId);
        expect(category).toBeDefined();
        expect(category.id).toBe(categoryId);
      });
    });
  });

  describe("getRandomTopicFromCategory", () => {
    it("should return a topic from the specified category", () => {
      const topic = getRandomTopicFromCategory("history");
      expect(typeof topic).toBe("string");
      expect(topic.length).toBeGreaterThan(0);
      expect(CATEGORIES.history.topics).toContain(topic);
    });

    it("should return different topics on multiple calls (randomness)", () => {
      const topics = new Set<string>();
      // Call multiple times to test randomness
      for (let i = 0; i < 10; i++) {
        topics.add(getRandomTopicFromCategory("science"));
      }
      // With 15 topics, we should get at least 2 different ones in 10 calls
      expect(topics.size).toBeGreaterThan(1);
    });

    it("should work for all categories", () => {
      const categories: Category[] = ["history", "science", "cinema", "geography", "sports", "literature", "art", "music"];
      categories.forEach((categoryId) => {
        const topic = getRandomTopicFromCategory(categoryId);
        expect(topic).toBeDefined();
        expect(CATEGORIES[categoryId].topics).toContain(topic);
      });
    });

    it("should throw error for invalid category", () => {
      // TypeScript would prevent this, but test runtime behavior
      expect(() => {
        getRandomTopicFromCategory("invalid" as Category);
      }).toThrow();
    });
  });

  describe("getRandomTopicFromAnyCategory", () => {
    it("should return a topic and category", () => {
      const result = getRandomTopicFromAnyCategory();
      expect(result).toHaveProperty("topic");
      expect(result).toHaveProperty("category");
      expect(typeof result.topic).toBe("string");
      expect(result.topic.length).toBeGreaterThan(0);
      expect(result.category).toBeDefined();
    });

    it("should return topic from valid category", () => {
      const result = getRandomTopicFromAnyCategory();
      expect(result.category.topics).toContain(result.topic);
    });

    it("should return different categories on multiple calls (randomness)", () => {
      const categoryIds = new Set<string>();
      for (let i = 0; i < 20; i++) {
        const result = getRandomTopicFromAnyCategory();
        categoryIds.add(result.category.id);
      }
      // With 8 categories, we should get at least 2 different ones in 20 calls
      expect(categoryIds.size).toBeGreaterThan(1);
    });

    it("should return valid category structure", () => {
      const result = getRandomTopicFromAnyCategory();
      expect(result.category).toHaveProperty("id");
      expect(result.category).toHaveProperty("name");
      expect(result.category).toHaveProperty("emoji");
      expect(result.category).toHaveProperty("topics");
    });
  });

  describe("CATEGORIES structure", () => {
    it("should have all required categories", () => {
      const expectedCategories: Category[] = ["history", "science", "cinema", "geography", "sports", "literature", "art", "music"];
      expectedCategories.forEach((categoryId) => {
        expect(CATEGORIES[categoryId]).toBeDefined();
      });
    });

    it("should have topics in each category", () => {
      Object.values(CATEGORIES).forEach((category) => {
        expect(category.topics.length).toBeGreaterThan(0);
        expect(category.topics.every((topic) => typeof topic === "string" && topic.length > 0)).toBe(true);
      });
    });

    it("should have unique category IDs", () => {
      const categoryIds = Object.keys(CATEGORIES);
      const uniqueIds = new Set(categoryIds);
      expect(categoryIds.length).toBe(uniqueIds.size);
    });
  });
});
