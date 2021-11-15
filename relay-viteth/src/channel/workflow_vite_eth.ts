import { ChannelVite, confirmed as txConfirmed } from "./channelVite";
import { ChannelEther } from "./channelEther";

export class WorkflowViteEth {
  channelVite: ChannelVite;
  channelEther: ChannelEther;

  constructor(channelVite: ChannelVite, channelEther: ChannelEther) {
    this.channelEther = channelEther;
    this.channelVite = channelVite;
  }

  async step1() {
    const info = await this.channelVite.getInfo("_confirmed");

    const { toHeight, events } = await this.channelVite.scanInputEvents(
      info.scannedHeight
    );

    if (!events || events.length === 0) {
      return;
    }
    const input = events[0];

    {
      // check input tx confirmed
      const isConfirmed = await txConfirmed(
        this.channelVite.viteProvider,
        input.accountBlockHash
      );

      if (!isConfirmed) {
        return;
      }
    }

    if (input.index != (BigInt(info.index) + 1n).toString()) {
      return;
    }

    const sig = await this.channelEther.signId(input.id);

    await this.channelVite.proveInputId(sig.v, sig.r, sig.s, input.id);

    await this.channelVite.updateInfo("_confirmed", {
      scannedHeight: input.accountBlockHeight,
      index: input.index,
    });
  }

  async step2() {
    const info = await this.channelVite.getInfo("_submit");

    const { events } = await this.channelVite.scanInputEvents(
      info.scannedHeight
    );

    if (!events || events.length === 0) {
      return;
    }

    const input = events[0];
    if (input.index != (BigInt(info.index) + 1n).toString()) {
      return;
    }

    const proved = await this.channelVite.scanInputProvedEvents(
      info.scannedHeight
    );

    const provedEvents = await proved.events
      .filter((x: any) => {
        return x.id === input.id;
      })
      .filter(async (x: any) => {
        return await this.channelEther.isKeeper(x.id, x.sigR, x.sigS, x.sigV);
      });

    if (provedEvents.length < this.channelEther.etherKeeperThreshold) {
      return;
    }

    console.log("ether approve id:", input.id);
    await this.channelEther.approveId(
      input.id,
      provedEvents
        .slice(0, this.channelEther.etherKeeperThreshold)
        .map((x: any) => {
          return {
            r: x.sigR,
            s: x.sigS,
            v: x.sigV,
          };
        })
    );

    await this.channelVite.updateInfo("_submit", {
      scannedHeight: input.accountBlockHeight,
      index: input.index,
    });
  }
}
