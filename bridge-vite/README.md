```
docker run -p 127.0.0.1:48132:48132 --rm vitelabs/gvite-nightly:v2.11.1-latest virtual --config conf/evm/node_config.json --rich vite_cecce91eb5ed40879105e1c780c572d087bb6ec91db043f422

npm run test test/channel.input.test.ts
npm run test test/channel.output.test.ts
```
