import {
  ChannelVite,
  confirmed as txConfirmed,
  ViteInputEvent,
  ViteProvedEvent,
} from "./channelVite";
import { ChannelEther } from "./channelEther";
import {
  WorkflowOptions,
  ChannelOptions,
  toJobs,
  StoredLogIndex,
  checkInputIndex,
  SenderMeta,
  TxRecord,
} from "./common";
import { ethers } from "ethers";

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
    if (!ethChannelId) {
      console.log("[vite->eth] eth channel id not exist", ethChannelId);
      return;
    }
    if (!checkInputIndex(input, info)) {
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

    // make sure that every tx was sent successfully 
    let nonce;
    let metaInfo = (await this.channelVite.getInfo("_senderMeta")) as SenderMeta;
    if (!metaInfo) {
      nonce = await this.channelEther.getTransactionCount();
      console.log("[vite->eth] the first time to output, current nonce:", nonce);
    } else {
      console.log("[vite->eth] current nonce from file:", metaInfo.nonce);
      nonce = metaInfo.nonce + 1;
    }

    let success = await sendTxWithCheckPrevious(nonce, this.channelEther, this.channelVite, ethChannelId, input, provedEvents);
    if (success) {
      info.inputsIndex[input.channelId] = input.index;
      await this.channelVite.saveSubmitInputs({
        height: input.height,
        logIndex: -1,
        txIndex: -1,
        inputsIndex: info.inputsIndex,
      });

      await this.channelVite.saveSenderMeta({
        nonce: nonce,
      });
    }
  }
}

async function sendTxWithCheckPrevious(nonce: number, channelEther: ChannelEther, channelVite: ChannelVite, ethChannelId: string, input: ViteInputEvent, provedEvents: any): Promise<boolean> {
  if (nonce < 0) {
    throw new Error("nonce is illegal!");
  }

  let txRecord = await channelVite.getTxRecord("_addr_" + (nonce - 1)) as TxRecord;
  
  if (txRecord && await channelEther.getConfirmationByHash(txRecord.hash) < 1) {
    // send previous tx
    await channelEther.sendRawTx(txRecord.signedTx);
    return false;
  }

  // send current tx with nonce
  const record = await channelEther.approveAndExecOutput(
    ethChannelId,
    "0x" + input.inputHash,
    provedEvents
      .slice(0, channelEther.etherKeeperThreshold)
      .map((x: ViteProvedEvent) => {
        return {
          r: "0x" + x.sigR,
          s: "0x" + x.sigS,
          v: x.sigV,
        };
      }),
    "0x" + input.dest,
    input.value,
    nonce
  );

  console.log("txRecord info:", record);
  await channelVite.saveAddrNonceTx(nonce, record);

  return true;
}