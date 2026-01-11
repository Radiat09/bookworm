// scripts/seedBooksAdvanced.ts
import { faker } from "@faker-js/faker";
import { Book } from "../modules/book/book.model";
import { Genre } from "../modules/genre/genre.model";

export const seedBooks = async (count = 50, shouldExit = false) => {
  try {
    console.log(`📚 Starting advanced book seeding (${count} books)...`);

    // Get all genres
    const genres = await Genre.find().select("_id name");

    if (genres.length === 0) {
      console.log("❌ No genres found. Please seed genres first.");
      if (shouldExit) process.exit(1);
      return;
    }

    // Check if books already exist
    const existingCount = await Book.countDocuments();

    if (existingCount >= count) {
      console.log(
        `📚 Sufficient books already exist (${existingCount} books). Skipping seeding.`
      );
      if (shouldExit) process.exit(0);
      return;
    }

    // Valid cover image extensions
    const imageExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];

    // Real book cover images from Unsplash (book-themed)
    const realCoverImages = [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1618666012174-83b441c0bc76?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=600&fit=crop&auto=format.jpg",
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=400&h=600&fit=crop&auto=format.jpg",
    ];

    // Generate fake books
    const booksToCreate = [];
    const booksNeeded = count - existingCount;

    console.log(`🌱 Generating ${booksNeeded} new books...`);

    for (let i = 0; i < booksNeeded; i++) {
      const randomGenre = genres[Math.floor(Math.random() * genres.length)];
      const title = faker.music.songName() + " " + faker.word.noun();
      const author = faker.person.fullName();
      const totalPages = faker.number.int({ min: 100, max: 800 });
      const publicationYear = faker.number.int({ min: 1900, max: 2023 });

      // Fixed: Use fractionDigits instead of precision
      const averageRating = parseFloat(
        faker.number
          .float({
            min: 3.0,
            max: 5.0,
            fractionDigits: 1,
          })
          .toFixed(1)
      );

      const totalReviews = faker.number.int({ min: 0, max: 5000 });
      const totalShelved = faker.number.int({
        min: totalReviews,
        max: totalReviews * 2,
      });
      const totalRead = Math.floor(totalShelved * 0.7);
      const totalCurrentlyReading = Math.floor(totalShelved * 0.1);
      const totalWantToRead = totalShelved - totalRead - totalCurrentlyReading;

      // FIX 1: Use real cover images from array
      const coverImage =
        realCoverImages[Math.floor(Math.random() * realCoverImages.length)];

      // FIX 2: Generate valid ISBN (10 or 13 digits)
      const generateISBN = (length: 10 | 13): string => {
        let isbn = "";
        for (let i = 0; i < length; i++) {
          isbn += Math.floor(Math.random() * 10);
        }
        return isbn;
      };

      const isbnLength = Math.random() > 0.5 ? 10 : 13;
      const isbn = generateISBN(isbnLength);

      const book = {
        title,
        author,
        genre: randomGenre._id,
        description: faker.lorem.paragraphs(2),
        coverImage,
        totalPages,
        publicationYear,
        isbn,
        averageRating,
        totalReviews,
        totalShelved,
        totalCurrentlyReading,
        totalRead,
        totalWantToRead,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent(),
      };

      booksToCreate.push(book);
    }

    // Insert in batches
    const batchSize = 20;
    for (let i = 0; i < booksToCreate.length; i += batchSize) {
      const batch = booksToCreate.slice(i, i + batchSize);
      await Book.insertMany(batch);
      console.log(
        `✅ Batch ${Math.floor(i / batchSize) + 1} inserted (${
          batch.length
        } books)`
      );
    }

    console.log("✅ Advanced book seeding completed!");
    console.log(`📚 Total books in database: ${await Book.countDocuments()}`);

    // Update all genre book counts
    console.log("📊 Updating genre book counts...");
    for (const genre of genres) {
      const bookCount = await Book.countDocuments({ genre: genre._id });
      await Genre.findByIdAndUpdate(genre._id, { totalBooks: bookCount });
    }

    console.log("🎉 All genre counts updated!");

    if (shouldExit) {
      process.exit(0);
    }
  } catch (error) {
    console.error("❌ Error in advanced book seeding:", error);
    if (shouldExit) process.exit(1);
    throw error;
  }
};
