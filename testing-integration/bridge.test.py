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


def backgroundRunRelay(index, submitted):
    runFp = subprocess.Popen(
        ["/bin/bash", "-c", "npx ts-node scripts/workflow_with_test.ts"],
        shell=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.STDOUT,
        cwd="./relay-viteth",
        env={
            **os.environ.copy(), 'WALLET_INDEX': str(index),
            'DATA_DIR': "../testing-integration/data." + str(index),
            'ETH_SUBMIT': str(submitted)
        })
    return runFp


ethNode = subprocess.Popen(["/bin/bash", "-c", "npx hardhat node"],
                           shell=False,
                           stdout=subprocess.DEVNULL,
                           stderr=subprocess.STDOUT,
                           cwd="./bridge-eth")
print("ether node started.")
viteNode = subprocess.Popen(["/bin/bash", "-c", "npx vuilder node"],
                            shell=False,
                            stdout=subprocess.DEVNULL,
                            stderr=subprocess.STDOUT,
                            cwd="./bridge-vite")

print("vite node started.")
time.sleep(3)
deployEthResult = blockRun("npx hardhat run scripts_test/1deploy_with_test.js",
                           "./bridge-eth")
print("ether contract deployed.")

writeCfg(
    './bridge-vite/scripts/channel.config.json', {
        'inputHash': deployEthResult['channelOutputHash'],
        'outputHash': deployEthResult['channelInputHash'],
    })

deployViteResult = blockRun("npx ts-node scripts/1deploy_with_test.ts",
                            "./bridge-vite")

print("vite contract deployed.")

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
print("ether input done.")
blockRun("npx hardhat run scripts_test/3ether_height.js", "./bridge-eth")

writeCfg("./bridge-vite/scripts/contract.config.json", {
    "vault": deployViteResult["vault"],
    "channelId": deployViteResult["channelId"]
})

blockRun("npx ts-node scripts/2input_with_test.ts", "./bridge-vite")
print("vite input done.")

print("relay 0 run")
fp0 = backgroundRunRelay(0, 1)
print("relay 1 run")
fp1 = backgroundRunRelay(1, 0)
print("relay 2 run")
fp2 = backgroundRunRelay(2, 0)

viteOk = False
etherOk = False
while True:
    if not viteOk:
        viteOutput = blockRun("npx ts-node scripts/3output_query.ts",
                              "./bridge-vite")
        if viteOutput["outputId"] == "1":
            print("ether -> vite done.")
            viteOk = True
    if not etherOk:
        etherOutput = blockRun(
            "npx hardhat run scripts_test/4channel_output_query.js",
            "./bridge-eth")
        if etherOutput["outputId"] == "1":
            print("vite -> ether done.")
            etherOk = True
    if viteOk and etherOk:
        break
    time.sleep(3)

fp0.terminate()
fp1.terminate()
fp2.terminate()

fp0.wait()
fp1.wait()
fp2.wait()

ethNode.terminate()
viteNode.terminate()
ethNode.wait()
viteNode.wait()
