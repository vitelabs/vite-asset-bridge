import { ChannelVite } from "./channelVite";
import { ChannelEther } from "./channelEther";
import { wallet } from "@vite/vitejs";
import {
  ChannelOptions,
  WorkflowOptions,
  toJobs,
  StoredLogIndex,
  checkInputIndex,
} from "./common";
export class WorkflowEthVite {
  channelVite: ChannelVite;
  channelEther: ChannelEther;

  jobs: Map<string, ChannelOptions>;

  constructor(
    channelVite: ChannelVite,
    channelEther: ChannelEther,
    options: WorkflowOptions[]
  ) {
    this.channelEther = channelEther;
    this.channelVite = channelVite;
    this.jobs = toJobs(options, "ether", "vite");
  }

  async step1() {
    let info = (await this.channelEther.getInfo(
      "_confirmed"
    )) as StoredLogIndex;
    if (!info) {
      info = {
        height: 0,
        txIndex: -1,
        logIndex: -1,
        inputsIndex: {},
      };
    }

    const { toHeight, events } = await this.channelEther.scanConfirmedInputs(
      info.height
    );

    if (!events) {
      return;
    }
    console.log("[eth->vite]", `height: ${info.height}->${toHeight}`, `scan input result:`, events);

    const filteredInputs = this.channelEther.filterAndSortInput(info, events);

    console.log("[eth->vite]", `height: ${info.height}->${toHeight}`, `filteredInputs:`, filteredInputs);

    if (filteredInputs.length === 0 && BigInt(toHeight) > BigInt(info.height)) {
      await this.channelEther.saveConfirmedInputs({
        height: +toHeight.toString(),
        inputsIndex: info.inputsIndex,
        txIndex: -1,
        logIndex: -1,
      });
      return;
    }
    if (filteredInputs.length === 0) {
      return;
    }
    const input = filteredInputs[0];
    console.log("[eth->vite] unconfirmed input", input);
    if (!checkInputIndex(input, info)) {
      console.warn(
        "[eth->vite]index do not match",
        input.index,
        info.inputsIndex[input.channelId]
      );
      return;
    }

    const destAddress = wallet.getAddressFromOriginalAddress(
      input.dest.slice(2)
    );

    const viteChannelId = this.jobs.get(input.channelId.toString())?.channelId;
    if (!viteChannelId) {
      console.log(
        "[eth->vite] vite channel id not exist.",
        input.channelId.toString(),
        viteChannelId
      );
      return;
    }

    const outputIdx = await this.channelVite.outputIndex(viteChannelId);
    if (!outputIdx) {
      console.warn("undefined outputIdx");
      return;
    }
    info.inputsIndex[input.channelId] = input.index;
    if (BigInt(outputIdx) + 1n > BigInt(input.index)) {
      console.warn(
        "[eth->vite] output index skip [output]",
        outputIdx,
        input.index.toString()
      );

      await this.channelEther.saveConfirmedInputs({
        height: input.height,
        inputsIndex: info.inputsIndex,
        txIndex: input.txIndex,
        logIndex: input.logIndex,
      });
      return;
    }
    if (BigInt(outputIdx) + 1n != BigInt(input.index)) {
      console.warn("output index error", outputIdx, input.index.toString());
      return;
    }

    const outputProved = await this.channelVite.outputProvedKeepers(
      this.channelVite.keeperId,
      input.inputHash,
      this.channelVite.signerAddress
    );

    if (outputProved) {
      console.warn(
        "[eth->vite] output index skip [proved]",
        outputIdx,
        input.index.toString()
      );
      await this.channelEther.saveConfirmedInputs({
        height: input.height,
        inputsIndex: info.inputsIndex,
        txIndex: input.txIndex,
        logIndex: input.logIndex,
      });
      return;
    }

    await this.channelVite.approveAndExecOutput(
      this.channelVite.keeperId,
      viteChannelId,
      input.inputHash,
      destAddress,
      input.value.toString()
    );

    await this.channelEther.saveConfirmedInputs({
      height: input.height,
      inputsIndex: info.inputsIndex,
      txIndex: input.txIndex,
      logIndex: input.logIndex,
    });
  }

  async step2() {}
}
