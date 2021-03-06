const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { Defaults } = require('./helpers/helpers');

let CloudStateSoulboundUpgradeable,IMPLEMENTATION,PROXY;
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

    IMPLEMENTATION = await (await ethers.getContractFactory("CloudStateSoulboundUpgradeable")).deploy(options);
    await IMPLEMENTATION.deployed();
    console.log("Contract Address: ",IMPLEMENTATION.address);
  });
  describe("CloudStateSoulboundUpgradeable", function () {
    it("Should allow to deploy Proxy Implementation", async function () {
      let test = await ethers.getContractFactory("CloudStateSoulboundUpgradeable");
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
      await expect(PROXY.connect(issuer).issue(receiver.address,"ipfs://test")).to.emit(PROXY, 'Issue').withArgs(issuer.address, receiver.address, 1);
      expect(parseInt(await PROXY.balanceOf(receiver.address))).to.be.eql(1);
      expect(await PROXY.tokenURI(1)).to.be.eql("ipfs://test")
    });
    it("Should allow minRole Issue to issue multiple", async function () {
      await expect(PROXY.connect(issuer).issueN([owner.address,issuer.address],["ipfs://test2","ipfs://test3"])).to.emit(PROXY, 'Issue').withArgs(issuer.address, owner.address, 2);
      expect(parseInt(await PROXY.balanceOf(owner.address))).to.be.eql(1);
      expect(parseInt(await PROXY.balanceOf(issuer.address))).to.be.eql(1);
      expect(await PROXY.tokenURI(2)).to.be.eql("ipfs://test2")
      expect(await PROXY.tokenURI(3)).to.be.eql("ipfs://test3")
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

  describe("Setter/Getter Functions", function () {
    it("Should revert non-admin to update contractURI", async function () {
      await expect(PROXY.connect(issuer).setContractURI("ipfs://newcontracturi")).to.be.reverted;
    });
    it("Should allow admin to update contractURI", async function () {
      await expect(PROXY.connect(owner).setContractURI("ipfs://newcontracturi")).to.not.be.reverted;
      expect(await PROXY.contractURI()).to.be.eql("ipfs://newcontracturi");
    });
    it("Should allow publicly querying issuer for token", async function () {
      expect(await PROXY.connect(denied).issuerOf(1)).to.be.eql(issuer.address);
    });
    it("Should allow publicly querying holder for token", async function () {
      expect(await PROXY.connect(denied).holderOf(1)).to.be.eql(receiver.address);
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
});
