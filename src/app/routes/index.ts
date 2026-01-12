import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { BookRoutes } from "../modules/book/book.route";
import { GenreRoutes } from "../modules/genre/genre.route";
import { OtpRoutes } from "../modules/otp/otp.route";
import { ReviewRoutes } from "../modules/review/review.route";
import { ShelfRoutes } from "../modules/shelf/shelf.route";
import { UserRoutes } from "../modules/user/user.route";

export const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: UserRoutes,
  },
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/otp",
    route: OtpRoutes,
  },
  {
    path: "/genre",
    route: GenreRoutes,
  },
  {
    path: "/book",
    route: BookRoutes,
  },
  {
    path: "/shelf",
    route: ShelfRoutes,
  },
  {
    path: "/review",
    route: ReviewRoutes,
  },
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
