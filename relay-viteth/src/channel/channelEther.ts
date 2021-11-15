// ---------
// ---------
import * as utils from "../utils/utils";
import { ethers } from "ethers";
import { newEtherProvider } from "./common";
import _channelAbi from "./channel.ether.abi.json";
import _keeperAbi from "./keeper.ether.abi.json";

interface ConfirmedInfo {
  height: string;
  txIndex: number;
  logIndex: number;

  index: string;
}

interface Input {
  id: string;
  index: string;

  height: number;
  txIndex: number;
  logIndex: number;
}

const ConfirmedThreshold = 0n;

export class ChannelEther {
  infoPath: string;

  etherChannelAddress: string;
  etherChannelAbi: any[];
  etherProvider: any;
  etherChannelContract: ethers.Contract;

  etherKeeperContract: ethers.Contract;
  etherKeeperAddress: string;
  etherKeeperAbi: any[];
  etherKeeperThreshold: number;

  signerKey: string;

  constructor(cfg: any) {
    this.etherChannelAbi = _channelAbi;
    this.etherKeeperAbi = _keeperAbi;
    this.infoPath = "./.channel_ether/confirmedInfo";
    const path = `m/44'/60'/0'/0/${1}`;
    this.signerKey = ethers.Wallet.fromMnemonic(cfg.mnemonic, path).privateKey;
    this.etherChannelAddress = cfg.channelAddress;
    this.etherKeeperAddress = cfg.keeperAddress;

    this.etherProvider = newEtherProvider(cfg.endpoint);
    this.etherChannelContract = new ethers.Contract(
      this.etherChannelAddress,
      this.etherChannelAbi,
      this.etherProvider
    );

    this.etherKeeperContract = new ethers.Contract(
      this.etherKeeperAddress,
      this.etherKeeperAbi,
      this.etherProvider
    );
  }

  getConfirmedInfo(): ConfirmedInfo {
    let json = utils.readJson(this.infoPath);
    let info = JSON.parse(json);
    return info;
  }

  updateConfirmedInfo(info: ConfirmedInfo) {
    utils.writeJson(this.infoPath, JSON.stringify(info));
  }

  async scanConfirmedInputs(fromHeight: string) {
    const current = await this.etherProvider.getBlockNumber();

    const toHeight = BigInt(current) - ConfirmedThreshold;

    // if (toHeight <= BigInt(fromHeight)) {
    //   return [fromHeight, null];
    // }

    const filterInput = this.etherChannelContract.filters.Input(
      null,
      null,
      null,
      null
    );

    const inputs = await this.etherChannelContract.queryFilter(
      filterInput,
      +fromHeight,
      +toHeight.toString()
    );

    if (!inputs || inputs.length === 0) {
      return { toHeight, inputs: [] };
    }
    return {
      toHeight,
      inputs: inputs.map((input: any) => {
        return {
          id: input.args.id,
          index: input.args.index,
          height: input.blockNumber,
          txIndex: input.transactionIndex,
          logIndex: input.logIndex,
          event: input.args,
        };
      }),
    };
  }

  async isKeeper(msg: string, r: string, s: string, v: number) {
    const expandedSig = {
      r: r,
      s: s,
      v: v,
    };
    const signature = ethers.utils.joinSignature(expandedSig);
    const recoveredAddress = ethers.utils.recoverAddress(msg, signature);
    return this.etherChannelContract.keepers(recoveredAddress);
  }

  async approveId(msg: string, events: any[]) {
    let sigs = [];
    events.forEach((sig) => {
      const address = ethers.utils.recoverAddress(msg, sig);
      sigs.push(Object.assign(sig, { address: address }));
    });

    sigs.sort(function(a, b) {
      if (a.address < b.address) return -1;
      if (a.address > b.address) return 1;
      return 0;
    });

    const rArr = sigs.map((s) => s.r);
    const vArr = sigs.map((s) => s.v);
    const sArr = sigs.map((s) => s.s);

    await this.etherKeeperContract.approveId(vArr, rArr, sArr, msg);
  }

  async signId(id: string) {
    const signingKey = new ethers.utils.SigningKey(this.signerKey);
    return signingKey.signDigest(id);
  }

  async inputIndex() {
    return this.etherChannelContract.inputIndex();
  }

  async prevInputId() {
    return this.etherChannelContract.prevInputId();
  }

  async outputIndex() {
    return this.etherChannelContract.outputIndex();
  }

  async prevOutputId() {
    return this.etherChannelContract.prevOutputId();
  }

  async token() {
    return this.etherChannelContract.token();
  }

  async approveOutput(v: number[], r: string[], s: string[], id: string) {
    return this.etherKeeperContract.approveId(v, r, s, id);
  }
}
