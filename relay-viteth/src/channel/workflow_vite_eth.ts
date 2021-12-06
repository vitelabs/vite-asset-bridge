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
    let info = await this.channelVite.getInfo("_confirmed");
    if (!info) {
      info = {
        height: "0",
        index: "0",
      };
    }

    const { toHeight, events } = await this.channelVite.scanInputEvents(
      info.height
    );

    if (!events || events.length === 0) {
      return;
    }
    const input = events[0];

    {
      // check input tx confirmed
      const isConfirmed = await txConfirmed(
        this.channelVite.viteProvider,
        input.hash
      );

      if (!isConfirmed) {
        return;
      }
    }
    console.log(input);

    if (input.event.index != (BigInt(info.index) + 1n).toString()) {
      console.warn("index not match", info.index, input.event.index);
      return;
    }

    const sig = await this.channelEther.signId("0x" + input.event.id);

    const proved = await this.channelVite.inputProvedKeepers(
      input.event.id,
      this.channelVite.signerAddress
    );
    if (proved && proved[0] === '1') {
      console.log(`input proved [${input.event.index}] [${input.event.id}]`, proved);
    } else {
      await this.channelVite.proveInputId(sig.v, sig.r, sig.s, input.event.id);
    }

    await this.channelVite.updateInfo("_confirmed", {
      height: input.height,
      index: input.event.index,
    });
  }

  async step2() {
    let info = await this.channelVite.getInfo("_submit");
    if (!info) {
      info = {
        height: "0",
        index: "0",
      };
    }

    const { events } = await this.channelVite.scanInputEvents(info.height);

    if (!events || events.length === 0) {
      return;
    }

    const input = events[0];
    console.log(input);
    if (input.event.index != (BigInt(info.index) + 1n).toString()) {
      return;
    }

    const proved = await this.channelVite.scanInputProvedEvents(info.height);
    console.log(proved);
    const provedEvents = await proved.events
      .filter((x: any) => {
        return x.event.id === input.event.id;
      })
      .filter(async (x: any) => {
        return await this.channelEther.isKeeper(
          "0x" + x.event.id,
          "0x" + x.event.sigR,
          "0x" + x.event.sigS,
          x.event.sigV
        );
      });

    if (provedEvents.length < this.channelEther.etherKeeperThreshold) {
      return;
    }

    console.log("ether approve id:", input.event.id);
    console.log("approve input", JSON.stringify(provedEvents));
    await this.channelEther.approveAndExecOutput(
      "0x" + input.event.id,
      provedEvents
        .slice(0, this.channelEther.etherKeeperThreshold)
        .map((x: any) => {
          return {
            r: "0x" + x.event.sigR,
            s: "0x" + x.event.sigS,
            v: x.event.sigV,
          };
        }),
      "0x" + input.event.dest,
      input.event.value
    );

    await this.channelVite.updateInfo("_submit", {
      height: input.height,
      index: input.event.index,
    });
  }
}
