import {
  ChannelVite,
  confirmed as txConfirmed,
  ViteProvedEvent,
} from "./channelVite";
import { ChannelEther } from "./channelEther";
import {
  WorkflowOptions,
  ChannelOptions,
  toJobs,
  StoredLogIndex,
  checkInputIndex,
} from "./common";

export class WorkflowViteEth {
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
    this.jobs = toJobs(options, "vite", "ether");
  }

  async step1() {
    let info = (await this.channelVite.getInfo("_confirmed")) as StoredLogIndex;
    if (!info) {
      info = {
        height: 0,
        txIndex: -1,
        logIndex: -1,
        inputsIndex: {},
      };
    }

    const { toHeight, events } = await this.channelVite.scanInputEvents(
      info.height
    );

    console.log(
      "[vite->eth]",
      `height: ${info.height}->${toHeight}`,
      `scan input result:`,
      events
    );

    if (!events || events.length === 0) {
      return;
    }
    const input = events[0];
    {
      // check input tx confirmed
      const isConfirmed = await txConfirmed(
        this.channelVite.viteProvider,
        input.accountBlockHash,
        this.channelVite.confirmedThreshold
      );

      if (!isConfirmed) {
        return;
      }
    }
    console.log("[vite->eth]", "unconfirmed input", input);

    const ethChannelId = this.jobs.get(input.channelId.toString())?.channelId;
    if (!ethChannelId) {
      console.log(
        "[vite->eth]",
        "eth channel id not exist.",
        input.channelId.toString(),
        ethChannelId
      );
      return;
    }

    if (!checkInputIndex(input, info)) {
      console.warn(
        "[vite->eth] index do not match",
        input.index,
        info.inputsIndex[input.channelId]
      );
      return;
    }

    const sig = await this.channelEther.signId("0x" + input.inputHash);

    const proved = await this.channelVite.inputProvedKeepers(
      input.inputHash,
      this.channelVite.signerAddress
    );
    if (proved && proved[0] === "1") {
      console.log(
        `[vite->eth] input proved [${input.index}] [${input.inputHash}]`,
        proved
      );
    } else {
      console.log(
        `[vite->eth] prove input [${input.index}] [${input.inputHash}]`
      );
      await this.channelVite.proveInputHash(
        sig.v,
        sig.r,
        sig.s,
        input.inputHash,
        input.channelId 
      );
    }

    info.inputsIndex[input.channelId] = input.index;
    await this.channelVite.saveConfirmedInputs({
      height: input.height,
      txIndex: -1,
      logIndex: -1,
      inputsIndex: info.inputsIndex,
    });
    return;
  }

  async step2() {
    console.log("[vite->eth] step2 submit sigs", this.channelEther.submitSigs);
    if (!this.channelEther.submitSigs) {
      return;
    }
    let info = (await this.channelVite.getInfo("_submit")) as StoredLogIndex;
    if (!info) {
      info = {
        height: 0,
        logIndex: -1,
        txIndex: -1,
        inputsIndex: {},
      };
    }

    const { events } = await this.channelVite.scanInputEvents(info.height);

    if (!events || events.length === 0) {
      return;
    }

    // new input happened
    const input = events[0];
    const ethChannelId = this.jobs.get(input.channelId.toString())?.channelId;
    if(!ethChannelId){
      console.log("[vite->eth] eth channel id not exist", ethChannelId);
      return;
    }
    if (!checkInputIndex(input, info)) {
      return;
    }

    var balance: any;
    if (ethChannelId == '0') {
      balance = await this.channelEther.getVaultETHBalance();
    } else {
      const tokenId = await this.channelEther.getChannelInfo(ethChannelId);
      if (tokenId == null) {
        console.log(
          "[vite->eth]token id not exist, the channelId:", ethChannelId);
        return;
      }
      balance = await this.channelEther.getVaultERC20Balance(tokenId);
    }

    if(BigInt(input.value) > balance) {
      console.warn(`[vite->eth] vault value in channel ${ethChannelId} is not enough`);
      return;
    }

    console.log(events);

    // scan new input proved
    const proved = await this.channelVite.scanInputProvedEvents(info.height);

    const inputProvedEvents = await proved.events.filter(
      (x: ViteProvedEvent) => {
        return x.inputHash === input.inputHash;
      }
    );

    const provedEvents = (
      await Promise.all(
        inputProvedEvents.map(async (event: ViteProvedEvent) => {
          const isKeeper = await this.channelEther.isKeeper(
            "0x" + event.inputHash,
            "0x" + event.sigR,
            "0x" + event.sigS,
            event.sigV
          );
          return { event, isKeeper: isKeeper };
        })
      )
    )
      .filter((x: { event: ViteProvedEvent; isKeeper: boolean }) => {
        return x.isKeeper;
      })
      .map((x: { event: ViteProvedEvent; isKeeper: boolean }) => x.event);

    if (provedEvents.length < this.channelEther.etherKeeperThreshold) {
      return;
    }
    

    

    if (await this.channelEther.approved("0x" + input.inputHash)) {
      console.log("[vite->eth]input hash approved in eth chain.");
    } else {
      console.log("[vite->eth]ether approve id:", input.inputHash);
      console.log("[vite->eth]approve input", JSON.stringify(provedEvents));
      await this.channelEther.approveAndExecOutput(
        ethChannelId,
        "0x" + input.inputHash,
        provedEvents
          .slice(0, this.channelEther.etherKeeperThreshold)
          .map((x:ViteProvedEvent) => {
            return {
              r: "0x" + x.sigR,
              s: "0x" + x.sigS,
              v: x.sigV,
            };
          }),
        "0x" + input.dest,
        input.value
      );
    }

    info.inputsIndex[input.channelId] = input.index;
    await this.channelVite.saveSubmitInputs({
      height: input.height,
      logIndex: -1,
      txIndex: -1,
      inputsIndex: info.inputsIndex,
    });
  }
}
