# Indexer API

## Get Txs

url: /txs
method: GET
params: fromAddress=vite_xxxx&fromNet=VITE
return:

```
[
	{

		id:string,
		idx:number,
		amount:string,
		fromAddress:string,
		toAddress:string,
		token: string,
		fromNet:string,
		fromHash:string,
		fromHashConfirmationNums: number, 
		toHash: string,
		toNet:string,
		toHashConfirmationNums: number,
		fee:string,
		time:string
	}
]
```

##

url: /tx
method: GET
params: from=ETH&to=VITE&id=xxxx
return:

```
{
	id:string,
	idx:number,
	amount:string,
	fromAddress:string,
	toAddress:string,
	token: string,
	fromNet:string,
	fromHash:string,
	fromHashConfirmationNums: number, 
	toHash: string,
	toNet:string,
	toHashConfirmationNums: number,
	fee:string,
	time:string
}
```
