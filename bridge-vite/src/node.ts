// docker run -v ~/.gvite/ipc:/root/ipc -p 127.0.0.1:48132:48132 --rm vitelabs/gvite-nightly:latest --config conf/evm/node_config.json
import { node } from "./config";
import { dockerRun } from "./docker";
import os from "os";

function dockerImage() {
  if (node.build === "release") {
    return `vitelabs/${node.name}:${node.version}`;
  }
  return `vitelabs/${node.name}-${node.build}:${node.version}-latest`;
}

class Node {
  private containerId: string;
  private container: any;
  public url: string;

  constructor(containerId: string, container: any, url: string) {
    this.containerId = containerId;
    this.container = container;
    this.url = url;
  }

  async stop(): Promise<void> {
    this.container.kill({ signal: 9 });
    return;
  }
}

async function _startNode(name: string, address: string): Promise<Node> {
  // console.log(dockerImage());
  const [_, container] = await dockerRun(
    false,
    dockerImage(),
    ["virtual", "--config", "conf/evm/node_config.json", "--rich", address],
    {
      Detach: true,
      Tty: false,
      AttachStdin: false,
      OpenStdin: false,
      AttachStdout: false,
      AttachStderr: false,
      HostConfig: {
        AutoRemove: true,
        PortBindings: {
          "48132/tcp": [
            {
              HostIp: "127.0.0.1",
              HostPort: "48132",
            },
          ],
        },
      },
    }
  );

  return new Node(container.Id, container, "http://127.0.0.1:48132");
}

export const startNode = _startNode;
