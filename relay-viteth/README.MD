## RELAY-VITETH
Relay represents a keeper to approve for transactions. 

1. Each relay will continuously scans the chain to find new Input events
2. Once scan a new Input event, the relay will parse out the transfer parameters and call the Vite contract to approve.
3. After an inputHash was approved by all keepers, the Output method of contract will be called to perform the real transfer action.

