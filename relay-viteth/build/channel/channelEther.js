"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelEther = void 0;
// ---------
// ---------
const utils = __importStar(require("../utils/utils"));
const ethers_1 = require("ethers");
const common_1 = require("./common");
const channel_ether_abi_json_1 = __importDefault(require("./channel.ether.abi.json"));
const keeper_ether_abi_json_1 = __importDefault(require("./keeper.ether.abi.json"));
const ConfirmedThreshold = 0n;
const ETH_INFO_PATH_PREFIX = "./.channel_ether/info";
class ChannelEther {
    constructor(cfg) {
        this.etherChannelAbi = channel_ether_abi_json_1.default;
        this.etherKeeperAbi = keeper_ether_abi_json_1.default;
        this.infoPath = ETH_INFO_PATH_PREFIX;
        this.fromBlockHeight = cfg.fromBlockHeight;
        const path = `m/44'/60'/0'/0/${0}`;
        this.signerKey = ethers_1.ethers.Wallet.fromMnemonic(cfg.mnemonic, path).privateKey;
        this.etherChannelAddress = cfg.channelAddress;
        this.etherKeeperAddress = cfg.keeperAddress;
        this.etherProvider = common_1.newEtherProvider(cfg.endpoint);
        this.etherChannelContract = new ethers_1.ethers.Contract(this.etherChannelAddress, this.etherChannelAbi, this.etherProvider);
        this.etherKeeperContract = new ethers_1.ethers.Contract(this.etherKeeperAddress, this.etherKeeperAbi, this.etherProvider);
        this.etherKeeperThreshold = 100000;
        this.signer = new ethers_1.ethers.Wallet(this.signerKey, this.etherProvider);
    }
    async init() {
        this.etherKeeperThreshold = await this.etherKeeperContract.threshold();
    }
    getInfo(prefix) {
        let json = utils.readJson(this.infoPath + prefix);
        if (!json) {
            return json;
        }
        let info = JSON.parse(json);
        return info;
    }
    updateInfo(prefix, info) {
        utils.writeJson(this.infoPath + prefix, JSON.stringify(info));
    }
    async scanConfirmedInputs(fromHeight) {
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
        const filterInput = this.etherChannelContract.filters.Input(null, null, null, null);
        const inputs = await this.etherChannelContract.queryFilter(filterInput, +fromHeight, +toHeight.toString());
        if (!inputs || inputs.length === 0) {
            return { toHeight, inputs: [] };
        }
        return {
            toHeight,
            inputs: inputs.map((input) => {
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
    async isKeeper(msg, r, s, v) {
        const expandedSig = {
            r: r,
            s: s,
            v: v,
        };
        const signature = ethers_1.ethers.utils.joinSignature(expandedSig);
        const recoveredAddress = ethers_1.ethers.utils.recoverAddress(msg, signature);
        // console.log("keeper", recoveredAddress);
        return this.etherKeeperContract.keepers(recoveredAddress);
    }
    async approveId(msg, events) {
        let sigs = [];
        events.forEach((sig) => {
            const address = ethers_1.ethers.utils.recoverAddress(msg, sig);
            sigs.push(Object.assign(sig, { address: address }));
        });
        sigs.sort(function (a, b) {
            if (a.address < b.address)
                return -1;
            if (a.address > b.address)
                return 1;
            return 0;
        });
        const rArr = sigs.map((s) => s.r);
        const vArr = sigs.map((s) => s.v);
        const sArr = sigs.map((s) => s.s);
        await this.etherKeeperContract
            .connect(this.signer)
            .approveId(vArr, rArr, sArr, msg);
    }
    async approveAndExecOutput(msg, events, dest, value) {
        let sigs = [];
        events.forEach((sig) => {
            const address = ethers_1.ethers.utils.recoverAddress(msg, sig);
            sigs.push(Object.assign(sig, { address: address }));
        });
        sigs.sort(function (a, b) {
            if (a.address < b.address)
                return -1;
            if (a.address > b.address)
                return 1;
            return 0;
        });
        const rArr = sigs.map((s) => s.r);
        const vArr = sigs.map((s) => s.v);
        const sArr = sigs.map((s) => s.s);
        await this.etherKeeperContract
            .connect(this.signer)
            .approveAndExecOutput(vArr, rArr, sArr, msg, dest, value, this.etherChannelAddress);
    }
    async signId(id) {
        const signingKey = new ethers_1.ethers.utils.SigningKey(this.signerKey);
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
exports.ChannelEther = ChannelEther;
