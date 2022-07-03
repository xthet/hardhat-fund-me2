const { networkConfig } = require("../helper-hardhat-config")
const { network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify") // to verify upon deployment
// syntactic sugar
// module.exports = async ({ getNamedAccounts, deployments }) => {

// }
module.exports = async (hre) => {
  const { getNamedAccounts, deployments } = hre // emptying object contents
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts() // gets address that owns default priv key or the account priv key stated in config's deployer object
  const chainId = network.config.chainId // get chainid of network specified in console
  log(chainId)
  //when you want to change chains (networks)
  // if chain ID is A use address B
  let ethUsdPriceFeedAddress
  if (
    developmentChains.includes(network.name) ||
    !networkConfig.hasOwnProperty(chainId)
  ) {
    // in this case i'll use a mock, i must have first deployed the mock contract and given it its suitable constructor argument
    const ethUsdAggregator = await deployments.get("MockV3Aggregator") // i get the address of the last deployed contract MockV3Aggregator
    // MockV3Aggregator is the substitute address for networks without a ethUsd pricefeed
    ethUsdPriceFeedAddress = ethUsdAggregator.address
  } else {
    ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"] // another way to call object properties
  }

  // use mocks when you want to deploy to localnode or hardhat network
  const fundMe = await deploy("FundMe", {
    from: deployer,
    args: [ethUsdPriceFeedAddress], // put price feed address here (constructor arg)
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  //at this point fundMe has been deployed so we can have its address for verification
  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, [ethUsdPriceFeedAddress])
  }
}

module.exports.tags = ["all", "fundMe"]
