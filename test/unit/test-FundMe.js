const { deployments, ethers, getNamedAccounts } = require("hardhat")
const { assert, expect } = require("chai")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
  ? describe.skip // do not run if on test network
  : describe("FundMe", async function () {
      let fundMe
      let deployer
      let mockV3Aggregator
      const sendValue = ethers.utils.parseEther("1") // 1 ether
      beforeEach(async function () {
        // deploy fundMe using hardhat-deploy
        // const accounts = await ethers.getSigners() // another way to get priv key providers
        // console.log(accounts)
        // const accountZero = accounts[0]
        deployer = (await getNamedAccounts()).deployer // getting address that owns the signing priv key i.e. msg.sender
        await deployments.fixture(["all"]) // with the 'all' tag i deploy all the contracts in the deploy folder
        // its like running the deploy statement in the console with the 'all' tag
        fundMe = await ethers.getContract("FundMe", deployer) // getting FundMe contract
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })

      describe("constructor", async function () {
        it("sets the aggregator addresses correctly", async function () {
          const response = await fundMe.priceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("fund", async function () {
        it("fails if you don't send enough ETH", async function () {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          ) // testing if it fails with the right error
        })

        it("updates the amount funded data structure", async function () {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.addressToAmountFunded(deployer) // same as addressToAmountFunded[msg.sender]
          // deployer is the EOA adress (msg.sender)  here its hardhat network account address
          assert.equal(response.toString(), sendValue.toString())
        })

        it("adds funder to funders array", async function () {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.funders(0)
          assert.equal(funder, deployer)
        })
      })

      describe("withdraw", async function () {
        beforeEach(async function () {
          await fundMe.fund({ value: sendValue })
        })

        it("can withdraw ETH from a single funder", async function () {
          // check initial balances
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // run withdraw()
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1) // gas cost can be found inside this object
          // get gas cost
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice) // multiply gas used with gas price
          // check ending balances
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // assert variables
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // using .add() cuz they're BigNumber
            endingDeployerBalance.add(gasCost).toString() // adding gasCost cuz part of init balance was lost to gas when running withdraw()
          )
        })

        it("can withraw from multiple funders", async function () {
          const accounts = await ethers.getSigners() //getting an array of hardhat accounts
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]) // connecting fundMe to new msg.senders (not deployers)
            await fundMeConnectedContract.fund({ value: sendValue }) // funding each instance
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          const transactionResponse = await fundMe.withdraw()
          const transactionReceipt = await transactionResponse.wait(1) // gas cost can be found inside this object
          // get gas cost
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice) // multiply gas used with gas price
          // check ending balances
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // assert variables
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // using .add() cuz they're BigNumber
            endingDeployerBalance.add(gasCost).toString() // adding gasCost cuz part of init balance was lost to gas when running withdraw()
          )

          // check if funders array resets
          await expect(fundMe.funders(0)).to.be.reverted

          // check the addressToAmountFunded mapping if their balances are now zero
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.addressToAmountFunded(accounts[i].address),
              0
            )
          }
        })

        it("only allows owner to withdraw", async function () {
          const accounts = await ethers.getSigners()
          const attacker = accounts[1] // an account that didn't deploy this contract and doesn't own it wanting to withdraw
          const attackerConnectedContract = await fundMe.connect(attacker) // attacker calling the contract
          await expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })

        it("cheaperWithdraw testing...", async function () {
          const accounts = await ethers.getSigners() //getting an array of hardhat accounts
          for (let i = 1; i < 6; i++) {
            const fundMeConnectedContract = await fundMe.connect(accounts[i]) // connecting fundMe to new msg.senders (not deployers)
            await fundMeConnectedContract.fund({ value: sendValue }) // funding each instance
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          const transactionResponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionResponse.wait(1) // gas cost can be found inside this object
          // get gas cost
          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice) // multiply gas used with gas price
          // check ending balances
          const endingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer
          )
          // assert variables
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(), // using .add() cuz they're BigNumber
            endingDeployerBalance.add(gasCost).toString() // adding gasCost cuz part of init balance was lost to gas when running withdraw()
          )

          // check if funders array resets
          await expect(fundMe.funders(0)).to.be.reverted

          // check the addressToAmountFunded mapping if their balances are now zero
          for (let i = 1; i < 6; i++) {
            assert.equal(
              await fundMe.addressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
      })
    })
