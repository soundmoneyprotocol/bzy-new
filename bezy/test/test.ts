import { expect } from "chai";
import { ethers } from "hardhat";

describe("BEZY", function () {
  let ContractFactory: any;
  let instance: any;
  let owner: any;
  let addr1: any;

  before(async function () {
    // Get the Contract Factory and signers
    ContractFactory = await ethers.getContractFactory("BEZY");
    [owner, addr1] = await ethers.getSigners();

    // Deploy the BEZY contract
    instance = await ContractFactory.deploy(owner.address);
    await instance.waitForDeployment();
  });

  it("Should have the correct name and symbol", async function () {
    expect(await instance.name()).to.equal("BEZY");
    expect(await instance.symbol()).to.equal("BZY");
  });

  it("Should mint the initial supply to the owner's address", async function () {
    const ownerBalance = await instance.balanceOf(owner.address);
    expect(ownerBalance).to.equal(ethers.parseUnits("25000000000", await instance.decimals()));
  });

  it("Should allow the owner to pause and unpause the contract", async function () {
    // Pause the contract
    await instance.pause();
    expect(await instance.paused()).to.equal(true);

    // Try to transfer tokens while paused
    await expect(instance.transfer(addr1.address, ethers.parseUnits("1000", await instance.decimals()))).to.be.revertedWith("Pausable: paused");

    // Unpause the contract
    await instance.unpause();
    expect(await instance.paused()).to.equal(false);

    // Transfer tokens after unpausing
    await instance.transfer(addr1.address, ethers.parseUnits("1000", await instance.decimals()));
    const addr1Balance = await instance.balanceOf(addr1.address);
    expect(addr1Balance).to.equal(ethers.parseUnits("1000", await instance.decimals()));
  });

  it("Should allow burning tokens", async function () {
    const initialBalance = await instance.balanceOf(owner.address);

    // Burn some tokens
    const burnAmount = ethers.parseUnits("5000", await instance.decimals());
    await instance.burn(burnAmount);

    const finalBalance = await instance.balanceOf(owner.address);
    expect(finalBalance).to.equal(initialBalance - burnAmount);
  });

  it("Should return the correct nonces", async function () {
    const nonce = await instance.nonces(owner.address);
    expect(nonce).to.equal(0); // Initially, the nonce should be 0
  });

  it("Should have voting power functionality", async function () {
    const initialVotes = await instance.getVotes(owner.address);
    expect(initialVotes).to.equal(0);

    // Delegate votes to self
    await instance.delegate(owner.address);
    const updatedVotes = await instance.getVotes(owner.address);
    expect(updatedVotes).to.equal(await instance.balanceOf(owner.address));
  });
});
