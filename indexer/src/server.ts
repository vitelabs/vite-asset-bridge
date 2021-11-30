import Koa, { Middleware } from "koa";
import Router from "koa-router";
import cors from "koa-cors";
import { EventsDB } from "./events";
import { Heights } from "./heights";
import { all, tx, txs } from "./router/txs";

export function startWebAppWith(db: EventsDB, cfg:any, indexer:any, heights:Heights) {
  const PORT = 8000;
  const app = new Koa();

  const router = new Router();

  const indexController: Middleware = async (ctx) => {
    ctx.body = "let's create something cool.";
  };

  

  const txsController: Middleware = async (ctx) => {
    await txs(db, indexer,ctx, heights);
  };
  const txController: Middleware = async (ctx) => {
    await tx(db, indexer,ctx, heights);
  };
  const allTxsController: Middleware = async (ctx) => {
    await all(db, indexer,ctx, heights);
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

  app.use(router.routes()).use(router.allowedMethods()).use(cors());
  app.listen(PORT, () => {
    console.log(`server is running on port ${PORT}`);
  });
}
