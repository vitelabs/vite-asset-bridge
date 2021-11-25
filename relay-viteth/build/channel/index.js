"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Workflow = void 0;
const channelVite_1 = require("./channelVite");
const channelEther_1 = require("./channelEther");
const workflow_eth_vite_1 = require("./workflow_eth_vite");
const workflow_vite_eth_1 = require("./workflow_vite_eth");
class Workflow {
    constructor(cfg) {
        this.channelVite = new channelVite_1.ChannelVite(cfg.vite);
        this.channelEther = new channelEther_1.ChannelEther(cfg.ether);
        this.workflowViteEth = new workflow_vite_eth_1.WorkflowViteEth(this.channelVite, this.channelEther);
        this.workflowEthVite = new workflow_eth_vite_1.WorkflowEthVite(this.channelVite, this.channelEther);
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
exports.Workflow = Workflow;
