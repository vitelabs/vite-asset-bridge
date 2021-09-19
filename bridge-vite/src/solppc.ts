import { compiler } from "./config";
import { dockerRun } from "./dockerRun";
import os from "os";

function dockerImage() {
  if (compiler.build === "release") {
    return `vitelabs/${compiler.name}:${compiler.version}`;
  }
  return `vitelabs/${compiler.name}-${compiler.build}:${compiler.version}-latest`;
}

interface CompileResult {
  contractNameArr: any[];
  abiArr: any[];
  byteCodeArr: any[];
  offChainCodeArr: any[];
}

async function _version() {
  const [result, _] = await dockerRun(true, dockerImage(), ["--version"], {});
  return parseVersion(result);
}

function parseVersion(output: string): string {
  let lines = output.split(os.EOL);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith("Version:")) {
      line = line.split(":")[1];
      return line.trim();
    }
  }
  return "";
}

async function _compile(filename: string): Promise<CompileResult> {
  const baseDir = `${compiler.sourceDir}`;
  const [result, _] = await dockerRun(
    true,
    dockerImage(),
    ["--bin", "--abi", `/root/tmp/contracts/${filename}`],
    {
      HostConfig: {
        Binds: [`${baseDir}:/root/tmp/contracts`],
      },
    }
  );
  return parse(result);
}

function parse(output: string): CompileResult {
  let result: CompileResult = {
    contractNameArr: [],
    abiArr: [],
    byteCodeArr: [],
    offChainCodeArr: [],
  };
  // TODO need compile source
  let lines = output.split(os.EOL);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (line.startsWith("======= ")) {
      line = line.slice("======= ".length, -" =======".length).split(":")[1];
      result.contractNameArr.push(line.trim());
    } else if (line.startsWith("Binary:")) {
      i++;
      result.byteCodeArr.push(lines[i].trim());
    } else if (line.startsWith("OffChain Binary:")) {
      i++;
      result.offChainCodeArr.push(lines[i].trim());
    } else if (line.startsWith("Contract JSON ABI")) {
      i++;
      result.abiArr.push(JSON.parse(lines[i]));
    }
  }

  return result;
}

export const compile = _compile;
export const version = _version;
