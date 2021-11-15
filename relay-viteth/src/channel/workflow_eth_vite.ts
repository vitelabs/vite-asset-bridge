import { ChannelVite } from "./channelVite";
import { ChannelEther } from "./channelEther";

export class WorkflowEthVite {
  channelVite: ChannelVite;
  channelEther: ChannelEther;

  constructor(channelVite: ChannelVite, channelEther: ChannelEther) {
    this.channelEther = channelEther;
    this.channelVite = channelVite;
  }

  async step1() {
    const info = await this.channelEther.getConfirmedInfo();

    const { toHeight, inputs } = await this.channelEther.scanConfirmedInputs(
      info.height
    );

    if (!inputs) {
      return;
    }
    const filteredInputs = inputs.filter((x) => {
      if (x.height < info.height) {
        return false;
      } else if (x.height > info.height) {
        return true;
      }

      if (x.txIndex < info.txIndex) {
        return false;
      } else if (x.txIndex > info.txIndex) {
        return true;
      }

      if (x.logIndex < info.logIndex) {
        return false;
      } else if (x.logIndex > info.logIndex) {
        return true;
      }
    });

    if (filteredInputs.length === 0) {
      await this.channelEther.updateConfirmedInfo({
        height: toHeight.toString(),
        index: info.index,
        txIndex: -1,
        logIndex: -1,
      });
      return;
    }
    const input = filteredInputs[0];
    if (input.index != (BigInt(info.index) + 1n).toString()) {
      console.warn("warn index do not match", input.index, info.index);
      return;
    }

    await this.channelVite.approveAndExecOutput(
      input.id,
      input.event.dest,
      input.event.value
    );

    await this.channelEther.updateConfirmedInfo({
      height: String(input.height),
      index: input.index,
      txIndex: input.txIndex,
      logIndex: input.logIndex,
    });
  }

  async step2() {}
}
