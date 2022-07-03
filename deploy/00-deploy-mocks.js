const { network } = require("hardhat")
const {
  networkConfig,
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require("../helper-hardhat-config")
module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre // emptying object contents
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts() // gets default priv key or the account priv key stated in config's deployer object
  const chainId = network.config.chainId // get chainid of network specified in console
  // log(chainId)

  if (
    developmentChains.includes(network.name) ||
    !networkConfig.hasOwnProperty(chainId)
  ) {
    log("Unidentfied network detected! Using mocks")
    await deploy("MockV3Aggregator", {
      from: deployer,
      args: [DECIMALS, INITIAL_ANSWER], // in order of the constructor positional arguments
      log: true,
    })
    log("Mocks deployed!! \n==============================")
  }
}

module.exports.tags = ["all", "mocks"] // add this tag in the console so that it identifies and runs only this deploy script
