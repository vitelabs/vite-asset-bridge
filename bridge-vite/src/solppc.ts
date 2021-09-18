import stream from "stream";
import getStream from "get-stream";
const Docker = require("dockerode");
import { compiler } from "./config";
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
  const docker = new Docker();
  const pass = new stream.PassThrough();
  const result = await docker.run(dockerImage(), ["--version"], pass);
  pass.end();
  const output = result[0];
  const container = result[1];

  // console.log(output.StatusCode, container.id);
  const out = await getStream(pass);
  return parseVersion(out);
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
  const docker = new Docker();
  const pass = new stream.PassThrough();
  const result = await docker.run(
    dockerImage(),
    ["--bin", "--abi", `/root/tmp/contracts/${filename}`],
    pass,
    {
      HostConfig: {
        Binds: [`${baseDir}:/root/tmp/contracts`],
      },
    }
  );
  pass.end();
  const output = result[0];
  const container = result[1];

  // console.log(output.StatusCode, container.id);
  const out = await getStream(pass);
  return parse(out);
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
