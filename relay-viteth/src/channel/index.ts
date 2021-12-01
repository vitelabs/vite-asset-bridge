import { ChannelVite } from "./channelVite";
import { ChannelEther } from "./channelEther";
import { WorkflowEthVite } from "./workflow_eth_vite";
import { WorkflowViteEth } from "./workflow_vite_eth";

export class Workflow {
  [x: string]: any;
  workflowViteEth: WorkflowViteEth;
  workflowEthVite: WorkflowEthVite;
  channelVite: ChannelVite;
  channelEther: ChannelEther;

  constructor(cfg: any, dataDir:string) {
    this.channelVite = new ChannelVite(cfg.vite, dataDir);
    this.channelEther = new ChannelEther(cfg.ether, dataDir);

    this.workflowViteEth = new WorkflowViteEth(
      this.channelVite,
      this.channelEther
    );
    this.workflowEthVite = new WorkflowEthVite(
      this.channelVite,
      this.channelEther
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
