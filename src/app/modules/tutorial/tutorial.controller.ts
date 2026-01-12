import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { TutorialServices } from "./tutorial.service";

const createTutorial = catchAsync(async (req: Request, res: Response) => {
  const tutorial = await TutorialServices.createTutorial(req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Tutorial created successfully",
    data: tutorial,
  });
});

const getAllTutorials = catchAsync(async (req: Request, res: Response) => {
  const result = await TutorialServices.getAllTutorials(
    req.query as Record<string, string>
  );

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorials retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getPublishedTutorials = catchAsync(
  async (req: Request, res: Response) => {
    const result = await TutorialServices.getPublishedTutorials(
      req.query as Record<string, string>
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Published tutorials retrieved successfully",
      data: result.data,
      meta: result.meta,
    });
  }
);

const getTutorialById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tutorial = await TutorialServices.getTutorialById(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorial retrieved successfully",
    data: tutorial,
  });
});

const updateTutorial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tutorial = await TutorialServices.updateTutorial(id, req.body);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorial updated successfully",
    data: tutorial,
  });
});

const deleteTutorial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tutorial = await TutorialServices.deleteTutorial(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorial deleted successfully",
    data: tutorial,
  });
});

const publishTutorial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tutorial = await TutorialServices.publishTutorial(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorial published successfully",
    data: tutorial,
  });
});

const unpublishTutorial = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tutorial = await TutorialServices.unpublishTutorial(id);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorial unpublished successfully",
    data: tutorial,
  });
});

const reorderTutorials = catchAsync(async (req: Request, res: Response) => {
  const { tutorials } = req.body;
  await TutorialServices.reorderTutorials(tutorials);

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorials reordered successfully",
    data: null,
  });
});

const getTutorialStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await TutorialServices.getTutorialStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Tutorial statistics retrieved successfully",
    data: stats,
  });
});

export const TutorialControllers = {
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
