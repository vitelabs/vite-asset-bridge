import { describe } from "mocha";
import { expect } from "chai";
import { ethers } from "ethers";
import { wallet } from "@vite/vitejs";

import { constant } from "@vite/vitejs";
describe("call test", () => {
  // the tests container
  it("checking vite address keccak256 bytes", async () => {
	  {
		let origin = wallet.getOriginalAddressFromAddress(
			"vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422"
		  );
		//   console.log(origin, ethers.utils.isHexString("0x" + origin));
		  const dest = "0x" + origin;
		  const id = ethers.utils.solidityKeccak256(["bytes"], [dest]);
		  console.log(id);
	  }
	  {
		let origin = wallet.getOriginalAddressFromAddress(
			"vite_f7de29b05f4d98348098143611f44c0469e1c9d4c677cbe4a4"
		  );
		//   console.log(origin, ethers.utils.isHexString("0x" + origin));
		  const dest = "0x" + origin;
		  const id = ethers.utils.solidityKeccak256(["bytes"], [dest]);
		  console.log(id); 
	  }
    
    
    // 0xaba067db2ca85ee50e494522797f7481c1c586874b51f2e8d0d7a306ac17ee4e
  }).timeout(1000);

});