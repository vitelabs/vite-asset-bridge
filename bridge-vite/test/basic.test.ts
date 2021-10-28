import { describe } from "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import { wallet } from "@vite/vitejs";

import { constant } from "@vite/vitejs";
describe("call test", () => {
  // the tests container
  it("checking vite address keccak256 bytes", async () => {
    let origin = wallet.getOriginalAddressFromAddress(
      "vite_40996a2ba285ad38930e09a43ee1bd0d84f756f65318e8073a"
    );
    console.log(origin, ethers.utils.isHexString("0x" + origin));
    const dest = "0x" + origin;
    const id = ethers.utils.solidityKeccak256(["bytes"], [dest]);
    console.log(id);
    expect(id).equal(
      "0xaba067db2ca85ee50e494522797f7481c1c586874b51f2e8d0d7a306ac17ee4e"
    );
    // 0xaba067db2ca85ee50e494522797f7481c1c586874b51f2e8d0d7a306ac17ee4e
  }).timeout(1000);

  it("checking ether address keccak256 bytes", async () => {
    let dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";
    const id = ethers.utils.solidityKeccak256(["bytes"], [dest]);
    console.log(id);
    expect(id).equal(
      "0x58cb431d173243bb32c749ebe59cd7d766d7dbbd5537946ecd14df00d31bb269"
    );
    // 0x58cb431d173243bb32c749ebe59cd7d766d7dbbd5537946ecd14df00d31bb269
  }).timeout(1000);

  it("checking ether address 2 keccak256 bytes", async () => {
    let dest = "0x09FDAD54B23D937BDB6244341b24566e5F79309b";
    const id = ethers.utils.solidityKeccak256(["bytes"], [dest]);
    const id2 = ethers.utils.solidityKeccak256(
      ["uint256", "bytes", "uint256", "bytes32"],
      [
        0,
        dest,
        "1000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000000",
      ]
    );
    // 0x182bfe56740a85d5ee35abc07143bf0d9f9525c43de7a988c6d03fa79ccba7e6
    console.log(id);
    console.log(id2);
    expect(id).equal(
      "0x58cb431d173243bb32c749ebe59cd7d766d7dbbd5537946ecd14df00d31bb269"
    );

    // 0x58cb431d173243bb32c749ebe59cd7d766d7dbbd5537946ecd14df00d31bb269
  }).timeout(1000);
});
