import { Router } from "express";
import { AuthRoutes } from "../modules/auth/auth.route";
import { GenreRoutes } from "../modules/genre/genre.route";
import { OtpRoutes } from "../modules/otp/otp.route";
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
];

moduleRoutes.forEach((route) => {
  router.use(route.path, route.route);
});
