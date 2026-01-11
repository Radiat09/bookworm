import { Genre } from "../modules/genre/genre.model";

export const seedGenres = async (shouldExit = false) => {
  try {
    console.log("🌱 Starting genre seeding...");

    const defaultGenres = [
      {
        name: "Fiction",
        description: "Imaginative storytelling and narrative prose",
      },
      { name: "Non-Fiction", description: "Factual and informational writing" },
      {
        name: "Mystery",
        description: "Stories involving crime or puzzle-solving",
      },
      {
        name: "Science Fiction",
        description: "Futuristic and speculative fiction",
      },
      {
        name: "Fantasy",
        description: "Magic, mythical creatures, and imaginary worlds",
      },
      {
        name: "Romance",
        description: "Love stories and emotional relationships",
      },
      { name: "Thriller", description: "Suspenseful and exciting stories" },
      { name: "Biography", description: "Accounts of peoples lives" },
      { name: "History", description: "Historical events and periods" },
      {
        name: "Self-Help",
        description: "Personal development and improvement",
      },
      { name: "Poetry", description: "Literary works in verse form" },
      { name: "Horror", description: "Frightening and terrifying stories" },
      { name: "Young Adult", description: "Books for teenage readers" },
      { name: "Children", description: "Books for young readers" },
      { name: "Classics", description: "Enduring works of literature" },
    ];

    // Check if genres already exist
    const existingCount = await Genre.countDocuments();

    if (existingCount > 0) {
      console.log(
        `📚 Genres already exist (${existingCount} genres). Skipping seeding.`
      );

      if (shouldExit) {
        process.exit(0);
      }
      return;
    }

    // Insert default genres
    await Genre.insertMany(defaultGenres);

    console.log("✅ Genres seeded successfully!");
    console.log(`📚 Total genres seeded: ${defaultGenres.length}`);

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error seeding genres:", error);

    if (shouldExit) {
      process.exit(1);
    }
    throw error;
  }
};
