const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

let NetworkStateSoulsUpgradeable,IMPLEMENTATION,PROXY;
let owner;
let sender;
let receiver;
let denied;
let deployer;
let options;

describe("Running Tests...", function () {
  before("Setup Contracts", async function() {
    [owner, sender, receiver, denied, deployer] = await ethers.getSigners();

    options = {
      //maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      //maxPriorityFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      //gasPrice: ethers.utils.parseUnits("100", "gwei"),
      gasLimit: 6_500_000,
    };

    IMPLEMENTATION = await (await ethers.getContractFactory("NetworkStateSoulsUpgradeable")).deploy(options);
    await IMPLEMENTATION.deployed();
    console.log(IMPLEMENTATION.address);
  });
  describe("NetworkStateSoulsUpgradeable", function () {
    it("Should allow to deploy Proxy Implementation", async function () {
      let test = await ethers.getContractFactory("NetworkStateSoulsUpgradeable");
      PROXY = await upgrades.deployProxy(test, [owner.address, "Network State Souls", "NTWRKSLS"]);
      await PROXY.deployed();
      expect(await PROXY.name()).to.be.eql("Network State Souls");
    });
    it("Should have ", async function () {

    });
  })
});
