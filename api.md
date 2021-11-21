# Indexer API

## Get Txs

url: /txs
method: GET
params: from=ETH&to=VITE&fromAddress=xxxx&toAddress=xxxx&desc=true
return:

```
[
	{
		id: string,
		idx: number,
		amount: string,
		toAddress: string,
		fromHash: string,
		fromHashConfirmationNums: number, 
		toHash: string,
		toHashConfirmationNums: number
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
	toAddress:string,
	fromHash:string,
	fromHashConfirmationNums: number, 
	toHash: string,
	toHashConfirmationNums: number
}
```
