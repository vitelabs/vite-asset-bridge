"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.newEtherProvider = void 0;
const ethers_1 = require("ethers");
function newEtherProvider(cfg) {
    if (cfg.type === "infura") {
        return new ethers_1.ethers.providers.InfuraProvider(cfg.network, cfg.key);
    }
    else if (cfg.type === "dev") {
        return new ethers_1.ethers.providers.JsonRpcProvider(cfg.url);
    }
    throw new Error("error endpoint config");
}
exports.newEtherProvider = newEtherProvider;
