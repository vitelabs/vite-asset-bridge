# Integration Test

## Prepare for Test
```
cd bridge-eth
npm install

cd bridge-vite
npm install

cd relay-viteth
npm install
```

## Run Test
```
./testing-integration/test.sh
```

## Step-By-Step

1. Deploy eth contract on local network 
2. Deploy vite contract on local network 
3. Launch a ETH->VITE && ETH->VITE transfer as input
4. Simulate three relays to approve for the transaction
5. Check outputs
