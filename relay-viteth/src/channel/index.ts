import { ChannelVite } from "./channelVite";
import { ChannelEther } from "./channelEther";
import { WorkflowEthVite } from "./workflow_eth_vite";
import { WorkflowViteEth } from "./workflow_vite_eth";

import { toWorkflowOptions } from "./common";

export class Workflow {
  [x: string]: any;
  workflowViteEth: WorkflowViteEth;
  workflowEthVite: WorkflowEthVite;
  channelVite: ChannelVite;
  channelEther: ChannelEther;

  constructor(cfg: any, dataDir: string) {
    this.channelVite = new ChannelVite(cfg.vite, dataDir);
    this.channelEther = new ChannelEther(cfg.ether, dataDir);

    const workflowOptions = toWorkflowOptions(cfg.channels, ["vite", "ether"]);
    const viteToEther = workflowOptions.get("vite-ether");
    const etherToVite = workflowOptions.get("ether-vite");
    if (!viteToEther || !etherToVite) {
      throw new Error("error channel options");
    }
    this.workflowViteEth = new WorkflowViteEth(
      this.channelVite,
      this.channelEther,
      viteToEther
    );
    this.workflowEthVite = new WorkflowEthVite(
      this.channelVite,
      this.channelEther,
      etherToVite
    );
  }
  async init() {
    await this.channelEther.init();
  }

  async work() {
    await Promise.all([
      this.workflowEthVite.step1(),
      this.workflowEthVite.step2(),
      this.workflowViteEth.step1(),
      this.workflowViteEth.step2(),
    ]);
  }
}
