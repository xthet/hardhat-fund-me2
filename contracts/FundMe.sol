// SPDX-License-Identifier: MIT
pragma solidity ^0.8.8;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "./PriceConverter.sol";

error FundMe__NotOwner();

contract FundMe {
  using PriceConverter for uint256;

  mapping(address => uint256) public addressToAmountFunded;
  address[] public funders;

  // Could we make this constant?  /* hint: no! We should make it immutable! */
  address public immutable i_owner;
  uint256 public constant MINIMUM_USD = 50 * 10**18; // because getConversionRate() returns data with *10e18

  AggregatorV3Interface public priceFeed;

  modifier onlyOwner() {
    // require(msg.sender == owner);
    if (msg.sender != i_owner) revert FundMe__NotOwner();
    _;
  }

  constructor(address priceFeedAddress) {
    i_owner = msg.sender;
    priceFeed = AggregatorV3Interface(priceFeedAddress); // A MockV3Aggregator contract is initiated
  }

  // fallback() external payable {
  //    fund();
  // }

  // receive() external payable {
  //     fund();
  // }

  function fund() public payable {
    require(
      msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
      "You need to spend more ETH!"
    ); // this is where i use priceconverter
    // require(PriceConverter.getConversionRate(msg.value) >= MINIMUM_USD, "You need to spend more ETH!");
    addressToAmountFunded[msg.sender] += msg.value;
    funders.push(msg.sender);
  }

  // function getVersion() public view returns (uint256){
  //     // AggregatorV3Interface priceFeed = AggregatorV3Interface(0x8A753747A1Fa494EC906cE90E9f37563A8AF630e);
  //     return priceFeed.version();
  // }

  function withdraw() public payable onlyOwner {
    for (uint256 funderIndex = 0; funderIndex < funders.length; funderIndex++) {
      address funder = funders[funderIndex];
      addressToAmountFunded[funder] = 0;
    }
    funders = new address[](0);
    // // transfer
    // payable(msg.sender).transfer(address(this).balance);
    // // send
    // bool sendSuccess = payable(msg.sender).send(address(this).balance);
    // require(sendSuccess, "Send failed");
    // call
    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }(""); // credit the owner
    require(callSuccess, "Call failed");
  }

  function cheaperWithdraw() public payable onlyOwner {
    // read funders array into memory array m_funders
    address[] memory m_funders = funders;
    for (
      uint256 funderIndex = 0;
      funderIndex < m_funders.length;
      funderIndex++
    ) {
      address funder = m_funders[funderIndex]; // now reading from memory not storage
      addressToAmountFunded[funder] = 0; // writing to storage, mappings cant be stored in memory
    }
    funders = new address[](0); // resetting the funders array

    (bool callSuccess, ) = payable(msg.sender).call{
      value: address(this).balance
    }(""); // credit the owner
    require(callSuccess, "Call failed");
  }

  // Explainer from: https://solidity-by-example.org/fallback/
  // Ether is sent to contract
  //      is msg.data empty?
  //          /   \
  //         yes  no
  //         /     \
  //    receive()?  fallback()
  //     /   \
  //   yes   no
  //  /        \
  //receive()  fallback()
}

// Concepts we didn't cover yet (will cover in later sections)
// 1. Enum
// 2. Events
// 3. Try / Catch
// 4. Function Selector
// 5. abi.encode / decode
// 6. Hash with keccak256
// 7. Yul / Assembly
