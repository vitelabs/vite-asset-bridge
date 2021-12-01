// ---------
// ---------
import * as utils from "../utils/utils";
import { ethers } from "ethers";
import { newEtherProvider, privateKey } from "./common";
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

const ETH_INFO_PATH_PREFIX = ".channel_ether/info";

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
  signer: ethers.Wallet;

  fromBlockHeight: string;

  constructor(cfg: any, dataDir: string) {
    this.etherChannelAbi = _channelAbi;
    this.etherKeeperAbi = _keeperAbi;
    if (dataDir) {
      this.infoPath = dataDir + "/" + ETH_INFO_PATH_PREFIX;
    } else {
      this.infoPath = ETH_INFO_PATH_PREFIX;
    }
    this.fromBlockHeight = cfg.fromBlockHeight;
    this.signerKey = privateKey(cfg.account);
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
    this.etherKeeperThreshold = 100000;
    this.signer = new ethers.Wallet(this.signerKey, this.etherProvider);
  }
  async init() {
    this.etherKeeperThreshold = await this.etherKeeperContract.threshold();
  }

  getInfo(prefix: string): any {
    let json = utils.readJson(this.infoPath + prefix);
    if (!json) {
      return json;
    }
    let info = JSON.parse(json);
    return info;
  }

  updateInfo(prefix: string, info: any) {
    utils.writeJson(this.infoPath + prefix, JSON.stringify(info));
  }

  async scanConfirmedInputs(fromHeight: string) {
    if (fromHeight === "0") {
      fromHeight = this.fromBlockHeight;
    }
    const current = await this.etherProvider.getBlockNumber();

    let toHeight = BigInt(current) - ConfirmedThreshold;
    if (BigInt(toHeight) > BigInt(fromHeight) + 5000n) {
      toHeight = BigInt(fromHeight) + 5000n;
    }

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
    // console.log("keeper", recoveredAddress);
    return this.etherKeeperContract.keepers(recoveredAddress);
  }

  async approveId(msg: string, events: any[]) {
    let sigs: any[] = [];
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

    await this.etherKeeperContract
      .connect(this.signer)
      .approveId(vArr, rArr, sArr, msg);
  }

  async approveAndExecOutput(
    msg: string,
    events: any[],
    dest: string,
    value: string
  ) {
    let sigs: any[] = [];
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

    await this.etherKeeperContract
      .connect(this.signer)
      .approveAndExecOutput(
        vArr,
        rArr,
        sArr,
        msg,
        dest,
        value,
        this.etherChannelAddress
      );
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
}
