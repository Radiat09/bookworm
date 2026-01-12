import httpStatus from "http-status-codes";
import { Types } from "mongoose";
import AppError from "../../errorHelpers/AppError";
import { QueryBuilder } from "../../utils/QueryBuilder";
import { tutorialSearchableFields } from "./tutorial.constant";
import {
  ICreateTutorial,
  ITutorial,
  IUpdateTutorial,
} from "./tutorial.interface";
import { Tutorial } from "./tutorial.model";

const createTutorial = async (payload: ICreateTutorial): Promise<ITutorial> => {
  // Check for duplicate YouTube URL
  const existingTutorial = await Tutorial.findOne({
    youtubeUrl: payload.youtubeUrl,
  });

  if (existingTutorial) {
    throw new AppError(
      httpStatus.CONFLICT,
      "Tutorial with this YouTube URL already exists"
    );
  }

  // Set default order if not provided
  if (!payload.order) {
    const maxOrder = await Tutorial.findOne().sort("-order").select("order");
    payload.order = maxOrder ? maxOrder.order + 1 : 1;
  }

  const tutorial = await Tutorial.create(payload);
  return tutorial;
};

const getAllTutorials = async (query: Record<string, string>) => {
  const queryBuilder = new QueryBuilder(Tutorial.find(), query);

  // Handle tag filtering
  if (query.tags) {
    const tags = query.tags.split(",");
    queryBuilder.filter({ tags: { $in: tags } });
    delete query.tags;
  }

  const tutorialQuery = queryBuilder
    .filter()
    .search(tutorialSearchableFields)
    .sort()
    .fields()
    .paginate();

  const [data, meta] = await Promise.all([
    tutorialQuery.build(),
    queryBuilder.getMeta(),
  ]);

  return {
    data,
    meta,
  };
};

const getPublishedTutorials = async (query: Record<string, string>) => {
  const publishedQuery = { ...query, isPublished: "true" };
  return getAllTutorials(publishedQuery);
};

const getTutorialById = async (id: string): Promise<ITutorial> => {
  const tutorial = await Tutorial.findById(id);

  if (!tutorial) {
    throw new AppError(httpStatus.NOT_FOUND, "Tutorial not found");
  }

  return tutorial;
};

const updateTutorial = async (
  id: string,
  payload: IUpdateTutorial
): Promise<ITutorial> => {
  // Check if tutorial exists
  const tutorial = await Tutorial.findById(id);
  if (!tutorial) {
    throw new AppError(httpStatus.NOT_FOUND, "Tutorial not found");
  }

  // Check for duplicate YouTube URL if being updated
  if (payload.youtubeUrl && payload.youtubeUrl !== tutorial.youtubeUrl) {
    const existingTutorial = await Tutorial.findOne({
      youtubeUrl: payload.youtubeUrl,
      _id: { $ne: id },
    });

    if (existingTutorial) {
      throw new AppError(
        httpStatus.CONFLICT,
        "Tutorial with this YouTube URL already exists"
      );
    }
  }

  const updatedTutorial = await Tutorial.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });

  if (!updatedTutorial) {
    throw new AppError(httpStatus.NOT_FOUND, "Tutorial not found");
  }

  return updatedTutorial;
};

const deleteTutorial = async (id: string): Promise<ITutorial | null> => {
  // Check if tutorial exists
  const tutorial = await Tutorial.findById(id);
  if (!tutorial) {
    throw new AppError(httpStatus.NOT_FOUND, "Tutorial not found");
  }

  const deletedTutorial = await Tutorial.findByIdAndDelete(id);
  return deletedTutorial;
};

const publishTutorial = async (id: string): Promise<ITutorial> => {
  const tutorial = await Tutorial.findByIdAndUpdate(
    id,
    {
      isPublished: true,
      publishedAt: new Date(),
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!tutorial) {
    throw new AppError(httpStatus.NOT_FOUND, "Tutorial not found");
  }

  return tutorial;
};

const unpublishTutorial = async (id: string): Promise<ITutorial> => {
  const tutorial = await Tutorial.findByIdAndUpdate(
    id,
    {
      isPublished: false,
      publishedAt: undefined,
    },
    {
      new: true,
      runValidators: true,
    }
  );

  if (!tutorial) {
    throw new AppError(httpStatus.NOT_FOUND, "Tutorial not found");
  }

  return tutorial;
};

const reorderTutorials = async (
  tutorials: { id: string; order: number }[]
): Promise<void> => {
  const bulkOps = tutorials.map(({ id, order }) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(id) }, // Convert string to ObjectId
      update: { order },
    },
  }));

  await Tutorial.bulkWrite(bulkOps);
};

const getTutorialStats = async () => {
  const stats = await Tutorial.aggregate([
    {
      $facet: {
        totalTutorials: [{ $count: "count" }],
        publishedTutorials: [
          { $match: { isPublished: true } },
          { $count: "count" },
        ],
        tutorialsByCategory: [
          { $group: { _id: "$category", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ],
        recentTutorials: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              title: 1,
              category: 1,
              isPublished: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        totalTutorials: { $arrayElemAt: ["$totalTutorials.count", 0] },
        publishedTutorials: { $arrayElemAt: ["$publishedTutorials.count", 0] },
        draftTutorials: {
          $subtract: [
            { $arrayElemAt: ["$totalTutorials.count", 0] },
            { $arrayElemAt: ["$publishedTutorials.count", 0] },
          ],
        },
        tutorialsByCategory: "$tutorialsByCategory",
        recentTutorials: "$recentTutorials",
      },
    },
  ]);

  return (
    stats[0] || {
      totalTutorials: 0,
      publishedTutorials: 0,
      draftTutorials: 0,
      tutorialsByCategory: [],
      recentTutorials: [],
    }
  );
};

export const TutorialServices = {
  createTutorial,
  getAllTutorials,
  getPublishedTutorials,
  getTutorialById,
  updateTutorial,
  deleteTutorial,
  publishTutorial,
  unpublishTutorial,
  reorderTutorials,
  getTutorialStats,
};
