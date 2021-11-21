import Koa, { Middleware } from "koa";
import Router from "koa-router";

const PORT = 8000;
const app = new Koa();

const router = new Router();

const indexController: Middleware = async (ctx) => {
  console.log(ctx.query);
  ctx.body = "let's create something cool.";
};

router.get("/", indexController);
app.use(router.routes()).use(router.allowedMethods());
app.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});
