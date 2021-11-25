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
exports.confirmed = exports.ChannelVite = void 0;
// ---------
// ---------
const utils = __importStar(require("../utils/utils"));
const vitejs_1 = require("@vite/vitejs");
const { HTTP_RPC } = require("@vite/vitejs-http");
const vitejs_2 = require("@vite/vitejs");
const vitejs_3 = require("@vite/vitejs");
const channel_vite_abi_json_1 = __importDefault(require("./channel.vite.abi.json"));
const channel_vite_code_json_1 = require("./channel.vite.code.json");
const VITE_INFO_PATH_PREFIX = "./.channel_vite/info";
const ConfirmedThreshold = 1;
class ChannelVite {
    constructor(cfg) {
        this.viteChannelAbi = channel_vite_abi_json_1.default;
        this.viteOffChainCode = Buffer.from(channel_vite_code_json_1.offChainCode, "hex").toString("base64");
        this.infoPath = VITE_INFO_PATH_PREFIX;
        this.viteProvider = new vitejs_1.ViteAPI(new HTTP_RPC(cfg.url), () => {
            console.log("vite provider connected");
        });
        this.viteChannelAddress = cfg.address;
        const viteWallet = vitejs_2.wallet.getWallet(cfg.mnemonic);
        const viteSigner = viteWallet.deriveAddressList(0, 1)[0];
        this.signerAddress = viteSigner.address;
        this.signerPrivateKey = viteSigner.privateKey;
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
    async scanInputEvents(fromHeight) {
        console.log("vite", "scan input events", fromHeight);
        return this.scanEvents(fromHeight, "Input");
    }
    async scanInputProvedEvents(fromHeight) {
        console.log("vite", "scan proved events", fromHeight);
        return this.scanEvents(fromHeight, "InputProved");
    }
    async scanEvents(fromHeight, eventName) {
        const channelAddress = this.viteChannelAddress;
        let heightRange = {
            [channelAddress]: {
                fromHeight: (BigInt(fromHeight) + 1n).toString(),
                toHeight: "0",
            },
        };
        // console.log(JSON.stringify(heightRange));
        const vmLogs = await this.viteProvider.request("ledger_getVmLogsByFilter", {
            addressHeightRange: heightRange,
        });
        if (!vmLogs) {
            return {
                toHeight: fromHeight,
                events: [],
            };
        }
        const eventAbi = this.viteChannelAbi.find((item) => item.type === "event" && item.name === eventName);
        const events = vmLogs.filter((x) => {
            return this.encodeLogId(eventAbi) === x.vmlog.topics[0];
        });
        if (!events || events.length === 0) {
            return { toHeight: fromHeight, events: [] };
        }
        return {
            toHeight: fromHeight,
            events: events.map((input) => {
                const event = this.decodeEvent(input.vmlog, this.viteChannelAbi, eventName);
                return {
                    event: event,
                    height: input.accountBlockHeight,
                    hash: input.accountBlockHash,
                };
            }),
        };
    }
    // filterInputLog(
    //   log: any,
    //   channelAbi: Array<{ name: string; type: string; }>,
    //   name: string
    // ) {
    //   const targetAbi = channelAbi.find(
    //     (item) => item.type === "event" && item.name === name
    //   );
    //   log.topics[0] ==
    //   const result = abi.decodeLog(
    //     channelAbi,
    //     Buffer.from(log.data ? log.data : "", "base64").toString("hex"),
    //     log.topics.slice(1, log.topics.length),
    //     ""
    //   );
    // }
    decodeEvent(log, channelAbi, name) {
        const result = vitejs_1.abi.decodeLog(channelAbi, Buffer.from(log.data ? log.data : "", "base64").toString("hex"), log.topics.slice(1, log.topics.length), name);
        return Object.assign(result, { name: name });
    }
    decodeLog(log, channelAbi) {
        // console.log(JSON.stringify(log));
        // console.log(JSON.stringify(channelAbi));
        // console.log(log, log['topics'], log['topics'][0]);
        const abiItem = channelAbi.find((item) => this.encodeLogId(item) === log.topics[0]);
        // console.log(abiItem);
        const result = vitejs_1.abi.decodeLog(channelAbi, Buffer.from(log.data ? log.data : "", "base64").toString("hex"), log.topics.slice(1, log.topics.length), abiItem?.name);
        return Object.assign(result, { name: abiItem?.name });
    }
    encodeLogId(item) {
        let id = "";
        if (item.type === "function") {
            id = vitejs_1.abi.encodeFunctionSignature(item);
        }
        else if (item.type === "event") {
            id = vitejs_1.abi.encodeLogSignature(item);
        }
        return id;
    }
    async output(id, address, value) {
        const sendResult = await writeContract(this.viteProvider, this.signerAddress, this.signerPrivateKey, this.viteChannelAddress, this.viteChannelAbi, "output", [id, address, value]);
    }
    async approveOutput(id) {
        const sendResult = await writeContract(this.viteProvider, this.signerAddress, this.signerPrivateKey, this.viteChannelAddress, this.viteChannelAbi, "approveOutput", [id]);
    }
    async approveAndExecOutput(id, dest, value) {
        const sendResult = await writeContract(this.viteProvider, this.signerAddress, this.signerPrivateKey, this.viteChannelAddress, this.viteChannelAbi, "approveAndExecOutput", [id, dest, value]);
    }
    async proveInputId(v, r, s, id) {
        const sendResult = await writeContract(this.viteProvider, this.signerAddress, this.signerPrivateKey, this.viteChannelAddress, this.viteChannelAbi, "proveInputId", [v, r, s, id]);
    }
    async inputIndex() {
        return readContract(this.viteProvider, this.viteChannelAddress, this.viteChannelAbi, this.viteOffChainCode, "inputIndex", []);
    }
    async prevInputId() {
        return readContract(this.viteProvider, this.viteChannelAddress, this.viteChannelAbi, this.viteOffChainCode, "prevInputId", []);
    }
    async outputIndex() {
        return readContract(this.viteProvider, this.viteChannelAddress, this.viteChannelAbi, this.viteOffChainCode, "outputIndex", []);
    }
    async prevOutputId() {
        return readContract(this.viteProvider, this.viteChannelAddress, this.viteChannelAbi, this.viteOffChainCode, "prevOutputId", []);
    }
    async approvedCnt(id) {
        return readContract(this.viteProvider, this.viteChannelAddress, this.viteChannelAbi, this.viteOffChainCode, "approvedCnt", [id]);
    }
    async approvedKeepers(id, address) {
        return readContract(this.viteProvider, this.viteChannelAddress, this.viteChannelAbi, this.viteOffChainCode, "approvedKeepers", [id, address]);
    }
}
exports.ChannelVite = ChannelVite;
async function writeContract(provider, from, signerKey, to, abi, methodName, params) {
    const tokenId = vitejs_3.constant.Vite_TokenId;
    const amount = "0";
    const methodAbi = abi.find((x) => {
        return x.name === methodName && x.type === "function";
    });
    if (!methodAbi) {
        throw new Error("method not found: " + methodName);
    }
    const block = vitejs_2.accountBlock.createAccountBlock("callContract", {
        address: from,
        abi: methodAbi,
        toAddress: to,
        params: params,
        tokenId: tokenId,
        amount: amount,
    });
    block.setProvider(provider).setPrivateKey(signerKey);
    await block.autoSetPreviousAccountBlock();
    const result = await block.sign().send();
    console.log("send block success", result);
    return result;
}
async function readContract(provider, to, abi, code, methodName, params) {
    const methodAbi = abi.find((x) => {
        return x.type === "offchain" && x.name === methodName;
    });
    if (!methodAbi) {
        throw new Error("method not found:" + methodName);
    }
    // console.log(to, methodAbi);
    return provider.callOffChainContract({
        address: to,
        abi: methodAbi,
        code: code,
        params: params,
    });
}
async function confirmed(provider, hash) {
    return provider
        .request("ledger_getAccountBlockByHash", hash)
        .then((block) => {
        if (!block) {
            return false;
        }
        else {
            if (!block.confirmedHash) {
                return false;
            }
            if (block.confirmedTimes < ConfirmedThreshold) {
                return false;
            }
            return true;
        }
    });
}
exports.confirmed = confirmed;
