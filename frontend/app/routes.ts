import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("r/:code", "routes/receive.tsx"),
] satisfies RouteConfig;
