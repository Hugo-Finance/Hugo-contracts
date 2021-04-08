# hugo-token
ERC20 token with voting and transfer fee distribution mechanism

## Setup
1. Install dependencies

```
npm i
```

2. Create json key-file with name `secrets.json` and following structure:
```json
{
  "mnemonic": "YOUR BIP39 PHRASE"
}
```

## Run tests

1. Run a local node
```
npx hardhat node
```

2. Launch tests
```
npx hardhat test
```

## Deploy

Deploy to mainnet or testnet with one command.
```
npx hardhat run --network <your-network> scripts/deploy.js
```
