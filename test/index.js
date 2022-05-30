const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { Defaults } = require('./helpers/helpers');

let NetworkStateSoulsUpgradeable,IMPLEMENTATION,PROXY;
let owner;
let issuer;
let receiver;
let denied;
let deployer;
let options;

describe("Running Tests...", function () {
  before("Setup Contracts", async function() {
    [owner, issuer, receiver, denied, deployer] = await ethers.getSigners();

    options = {
      //maxFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      //maxPriorityFeePerGas: ethers.utils.parseUnits("50", "gwei"),
      //gasPrice: ethers.utils.parseUnits("100", "gwei"),
      gasLimit: 6_500_000,
    };

    IMPLEMENTATION = await (await ethers.getContractFactory("NetworkStateSoulsUpgradeable")).deploy(options);
    await IMPLEMENTATION.deployed();
    console.log("Contract Address: ",IMPLEMENTATION.address);
  });
  describe("NetworkStateSoulsUpgradeable", function () {
    it("Should allow to deploy Proxy Implementation", async function () {
      let test = await ethers.getContractFactory("NetworkStateSoulsUpgradeable");
      PROXY = await upgrades.deployProxy(test, [owner.address, "Network State Souls", "NTWRKSLS"]);
      await PROXY.deployed();
      expect(await PROXY.name()).to.be.eql("Network State Souls");
      console.log("Proxy Address: ",PROXY.address);
    });

    it("Should have default admin set", async function () {
      expect(await PROXY.hasRole(Defaults.DEFAULT_ADMIN_ROLE,owner.address)).to.be.eql(true);
    });

    it("Should allow granting iisuer role by default admin", async function () {
      expect(await PROXY.connect(owner).grantRole(Defaults.ISSUER_ROLE, issuer.address)).to.emit("RoleGranted");
    });

    it("Should allow admin to give issuer rights to transfer", async function () {
      await expect(PROXY.connect(owner).setApprovalForAll(issuer.address,true)).to.not.be.reverted;
    });
  })

  describe("Issuing Functions", function () {
    it("Should revert if non-issuer tries to issue", async function () {
      await expect(PROXY.connect(denied).issue(denied.address,"...")).to.be.reverted;
    });
    it("Should allow minRole Issue to issue", async function () {
      await expect(PROXY.connect(issuer).issue(receiver.address,"...")).to.emit(PROXY, 'Issue').withArgs(issuer.address, receiver.address, 1);
    });
  })

  describe("Revoke Functions", function () {
    it("Should revert if non-issuer tries to revoke", async function () {
      await expect(PROXY.connect(denied).revoke(1)).to.be.reverted;
    });
    it("Should allow revoking by minRole issuer", async function () {
      await expect(PROXY.connect(issuer).revoke(1)).to.emit(PROXY, 'Revoke').withArgs(issuer.address, receiver.address, 1);
    });
  })

  describe("Transfer Functions", function () {
    it("Should revert if holder tries to transfer", async function () {
      await expect(PROXY.connect(receiver).transferFrom(receiver.address,denied.address,1)).to.be.reverted;
      expect(parseInt(await PROXY.balanceOf(receiver.address))).to.be.eql(1);
    });
    it("Should revert if issuer tries to transfer token", async function () {
      await PROXY.connect(issuer).transferFrom(receiver.address,denied.address,1);
      expect(parseInt(await PROXY.balanceOf(receiver.address))).to.be.eql(1);
    });
  })
});
