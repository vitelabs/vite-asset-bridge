import stream from "stream";
import getStream from "get-stream";
const Docker = require("dockerode");

const docker = new Docker();

async function _dockerRun(
  returnOut: boolean,
  image: string,
  params: string[],
  cfg: any
) {
  if (returnOut) {
    const pass = new stream.PassThrough();
    const result = await docker.run(image, params, pass, cfg);
    pass.end();
    const output = result[0];
    const container = result[1];

    // console.log(output.StatusCode, container.id);
    const out = await getStream(pass);
    return [out, container];
  } else {
    const result = await docker.run(image, params, null, cfg);
    const output = result[0];
    const container = result[1];
    // console.log(output.StatusCode, container.id);
    return ["", container];
  }
}

export const dockerRun = _dockerRun;
