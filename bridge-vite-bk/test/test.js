
const {
	abi
} = require('@vite/vitejs');


let abi_json =
{
	"constant":
		false,
	"inputs":
		[
			{
				"name":
					"id",
				"type":
					"bytes32"
			},
			{
				"name":
					"dest",
				"type":
					"address"
			},
			{
				"name":
					"value",
				"type":
					"uint256"
			}
		],
	"name":
		"submitInput",
	"outputs":
		[
		],
	"payable":
		false,
	"stateMutability":
		"nonpayable",
	"type":
		"function"
}


let result = abi.encodeFunctionCall(abi_json, [2345675643, 223]);


const data = '8xQGxlx2xJFLWsOTISdPxK698zpCdDoxLK7lhcRaVr8jEPW0AAAAAAAAAAAAAACAckV+rZFkfRdZaEM1qM5R9TGk9AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAew=='

result = Buffer.from(data, 'base64');

let decodeParametersResult1 = abi.decodeParameters(abi_json, result.slice(8));

console.log(decodeParametersResult1);
