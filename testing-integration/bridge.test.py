#!/usr/bin/env python
# -*-coding:utf-8 -*-

import os
import subprocess
# os.system("ps -ef")
import time
import signal
import json


def parseResult(lines):
    for line in lines:
        line = line.decode('utf8').strip()
        # print(line, line.startswith("result: "))
        if line.startswith("result: "):
            return json.loads(line.removeprefix("result: "))
    return None


def writeCfg(filename, content):
    f = open(filename, 'w+')
    f.write(json.dumps(content))
    f.close()


def blockRun(cmd, cwd):
    runFp = subprocess.Popen(["/bin/bash", "-c", cmd],
                             shell=False,
                             stdout=subprocess.PIPE,
                             cwd=cwd)
    runFp.wait()
    runResult = parseResult(runFp.stdout.readlines())
    assert runResult is not None
    return runResult


# ethNode = subprocess.Popen(["/bin/bash", "-c", "npx hardhat node"],
#                            shell=False,
#                            cwd="./bridge-eth")
# viteNode = subprocess.Popen(["/bin/bash", "-c", "npx vuilder node"],
#                             shell=False,
#                             cwd="./bridge-vite")

# time.sleep(6)

deployEthResult = blockRun("npx hardhat run scripts/1deploy_with_test.js",
                           "./bridge-eth")

writeCfg(
    './bridge-vite/scripts/channel.config.json', {
        'inputHash': deployEthResult['channelInputHash'],
        'outputHash': deployEthResult['channelOutputHash'],
    })

deployViteResult = blockRun("npx ts-node scripts/1deploy_with_test.ts",
                            "./bridge-vite")

writeCfg(
    './relay-viteth/scripts/channel.config.json', {
        "ethChannelAddress": deployEthResult["vault"],
        "ethKeeperAddress": deployEthResult["keeper"],
        "viteChannelAddress": deployViteResult["vault"]
    })

writeCfg(
    './bridge-eth/scripts_test/0contract_config.json', {
        "vault": deployEthResult["vault"],
        "erc20": deployEthResult["erc20"],
        "channelId": deployEthResult["channelId"]
    })

blockRun("npx hardhat run scripts_test/2channel_input.js", "./bridge-eth")
blockRun("npx hardhat run scripts_test/3ether_height.js", "./bridge-eth")

writeCfg("./bridge-vite/scripts/contract.config.json", {
    "vault": deployViteResult["vault"],
    "channelId": deployViteResult["channelId"]
})

print(deployEthResult)
print(deployViteResult)
# kill9(ethNode)
# kill9(viteNode)

# ethNode.terminate()
# viteNode.terminate()
# ethNode.wait()
# viteNode.wait()
