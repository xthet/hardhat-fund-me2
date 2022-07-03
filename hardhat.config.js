require("dotenv").config()

require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("@nomiclabs/hardhat-ethers")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners()

  for (const account of accounts) {
    console.log(account.address)
  }
})

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  // solidity: "0.8.8",
  solidity: {
    compilers: [{ version: "0.8.8" }, { version: "0.6.6" }], // 0.6.6 for the MockV3Aggregator contract
  },
  networks: {
    ropsten: {
      url: process.env.ROPSTEN_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 3,
      blockConfirmations: 5,
    },
    rinkeby: {
      url: process.env.RINKEBY_RPC_URL || "",
      accounts: [process.env.PRIVATE_KEY],
      chainId: 4,
      blockConfirmations: 6,
    },
  },
  gasReporter: {
    enabled: true,
    outputFile: "gas-report.txt",
    noColors: true,
    currency: "USD",
    coinmarketcap: process.env.MARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  namedAccounts: {
    deployer: {
      default: 0, // this says that the first private key in the accounts arr is to be used as default when deploying
      // 4: 1, this says that when deploying on a network with a chainId of 4 use the private key at index position 1
    },
  },
  mocha: {
    timeout: 100000000, // asking mocha to give the testnet more time
  },
}
