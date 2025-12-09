import { Hono } from "hono";

const taskRoute = new Hono();

taskRoute.get("/", (c) => {
  return c.text("Task Home");
})

export default taskRoute;
