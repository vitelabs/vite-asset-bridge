import Koa, { Middleware } from "koa";
import Router from "koa-router";
import { EventsDB } from "./events";
import { tx, txs } from "./router/txs";

export function startWebAppWith(db: EventsDB) {
  const PORT = 8000;
  const app = new Koa();

  const router = new Router();

  const indexController: Middleware = async (ctx) => {
    ctx.body = "let's create something cool.";
  };
  const txsController: Middleware = async (ctx) => {
    await txs(db, ctx);
  };
  const txController: Middleware = async (ctx) => {
    await tx(db, ctx);
  };

  router.get("/", indexController);
  router.get("/tx", txController);
  router.get("/txs", txsController);

  app.use(router.routes()).use(router.allowedMethods());
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
}
