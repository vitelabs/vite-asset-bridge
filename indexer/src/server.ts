import Koa, { Middleware } from "koa";
import Router from "koa-router";
import { EventsDB } from "./events";
import { all, tx, txs } from "./router/txs";

export function startWebAppWith(db: EventsDB, cfg:any, indexer:any) {
  const PORT = 8000;
  const app = new Koa();

  const router = new Router();

  const indexController: Middleware = async (ctx) => {
    ctx.body = "let's create something cool.";
  };

  

  const txsController: Middleware = async (ctx) => {
    await txs(db, indexer,ctx);
  };
  const txController: Middleware = async (ctx) => {
    await tx(db, indexer,ctx);
  };
  const allTxsController: Middleware = async (ctx) => {
    await all(db, indexer,ctx);
  };

  const inputsController: Middleware = async (ctx) => {
    ctx.body = await db.db("Input").get((t: any) => {
      return true;
    });
  };
  const outputsController: Middleware = async (ctx) => {
    ctx.body = await db.db("Output").get((t: any) => {
      return true;
    });
  };

  router.get("/", indexController);
  router.get("/tx", txController);
  router.get("/txs", txsController);
  router.get("/txs/all", allTxsController);
  router.get("/inputs", inputsController);
  router.get("/outputs", outputsController);

  app.use(router.routes()).use(router.allowedMethods());
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
}
