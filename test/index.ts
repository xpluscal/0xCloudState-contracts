import { expect } from "chai";
import { ethers, upgrades } from "hardhat";

let NetworkStateSoulsUpgradeable,IMPLEMENTATION;
let owner = {};
let sender = {};
let receiver = {};
let denied = {};
describe("NetworkStateSoulsUpgradeable", function () {
  before("Setup Contracts", async function() {
    [owner, sender, receiver, denied] = await ethers.getSigners();
    NetworkStateSoulsUpgradeable = await ethers.getContractFactory("NetworkStateSoulsUpgradeable");
    IMPLEMENTATION = await NetworkStateSoulsUpgradeable.deploy();
    await IMPLEMENTATION.deployed();
    console.log(IMPLEMENTATION.address);

  });
  it("Should return the new greeting once it's changed", async function () {

  });
});
