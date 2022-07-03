const { getNamedAccounts, ethers, network } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")
const { assert, expect } = require("chai")

developmentChains.includes(network.name)
  ? describe.skip // do not run if on local network
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      const sendValue = ethers.utils.parseEther("0.1")
      beforeEach(async function () {
        deployer = (await getNamedAccounts()).deployer // uses the first priv key address as deployer
        // await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("allows people to fund and withdraw", async function () {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(fundMe.address) // get contract balance
        assert.equal(endingBalance.toString(), "0")
      })
    })
