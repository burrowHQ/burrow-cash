# Burrow.cash

Update for deployment.

# Quick Start

To run this project locally:

1. Prerequisites: Make sure you've installed [Node.js] ≥ 12.
2. Install dependencies: `yarn`
3. Run the local development server: `yarn dev` (see `package.json` for a
   full list of `scripts` you can run with `yarn`)

Now you'll have a local development environment backed by the NEAR TestNet!

Go ahead and play with the app and the code. As you make code changes, the app will automatically reload.

# Exploring The Code

1. The "backend" code lives in [burrowfdn/burrowland/contract](https://github.com/burrowfdn/burrowland/tree/main/contract). See that repo's README and it's [API.md](https://github.com/burrowfdn/burrowland/blob/main/contract/API.md) for more info.
2. The frontend code lives in the [/src/](./src/) folder. [/src/index.html](./src/index.html) is a great place to start exploring. Note that it loads in [/src/index.tsx](./src/index.tsx), where you can learn how the frontend connects to the NEAR blockchain.
3. Tests: there are different kinds of tests for the frontend and the smart contract. See [burrowfdn/burrowland](https://github.com/burrowfdn/burrowland/)'s `README` for info about how it's tested. The frontend code gets tested with [jest]. You can the later with `yarn run test`.

# Deploy

## Step 0: set env variables name in .env file

```
NEXT_PUBLIC_DEFAULT_NETWORK=testnet
NEXT_PUBLIC_CONTRACT_NAME=contract.1638481328.burrow.testnet

# use these for mainnet
# NEXT_PUBLIC_DEFAULT_NETWORK=mainnet
# NEXT_PUBLIC_CONTRACT_NAME=contract.main.burrow.near

NEXT_PUBLIC_NEAR_STORAGE_DEPOSIT=0.25

# get the id from the walletconnect.com website (create a new project in dashboard)
NEXT_PUBLIC_WALLET_CONNECT_ID=
```

## Step 1: deploy!

One command:

    yarn deploy

As you can see in `package.json`, this does the following:

1. builds & deploys frontend code to GitHub using [gh-pages]. This will only work if the project already has a repository set up on GitHub. Feel free to modify the `deploy` script in `package.json` to deploy elsewhere.

# Troubleshooting

On Windows, if you're seeing an error containing `EPERM` it may be related to spaces in your path. Please see [this issue](https://github.com/zkat/npx/issues/209) for more details.

[react]: https://reactjs.org/
[create-near-app]: https://github.com/near/create-near-app
[node.js]: https://nodejs.org/en/download/package-manager/
[jest]: https://jestjs.io/
[near accounts]: https://docs.near.org/docs/concepts/account
[near wallet]: https://wallet.testnet.near.org/
[near-cli]: https://github.com/near/near-cli
[gh-pages]: https://github.com/tschaub/gh-pages
