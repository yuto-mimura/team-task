import { Hono } from "hono";

const userRoute = new Hono();

// user一覧取得
userRoute.get("/user", (c) => {
  return c.text("Hello World");
});

// 単一user取得
userRoute.get("/:id", (c) => {
  const userId = c.req.param("id");
  return c.text(`User ID: ${userId}`);
})

export default userRoute;
