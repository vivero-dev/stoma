import { Hono } from "hono";

const app = new Hono();

app.get("/hello", (c) => c.text("hello from bare hono"));

export default app;
