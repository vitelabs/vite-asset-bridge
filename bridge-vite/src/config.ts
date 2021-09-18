import _cfg from "./vitejs.config.json";

const _network = _cfg.networks.local;
const _compiler = _cfg.compilers.solppc;

interface Network {
  url: string;
  mnemonic: string;
}

interface Compiler {
  version: string;
  build: string;
  name: string;
  sourceDir?: string;
}

export const network: Network = _network;

export const compiler: Compiler = compilerCfg();

function compilerCfg(): Compiler {
  let result: Compiler = _compiler;
  if (!result.sourceDir) {
    result.sourceDir = process.env.VITE_CONTRACTS_ROOT;
  }
  if (!result.sourceDir) {
    console.error("contract source dir is empty");
    process.exit(1);
  }
  return result;
}
