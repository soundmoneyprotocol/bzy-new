import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy the token contract
  const TokenFactory = await ethers.getContractFactory("ERC20Mintable");
  const token = await TokenFactory.deploy();
  await token.deployed();

  console.log("Token deployed to:", token.address);

  // Deploy the crowdsale contract
  const CrowdsaleFactory = await ethers.getContractFactory("BezyCrowdsale");

  const rate = 1; // Rate in TKNbits
  const wallet = deployer.address; // Wallet to collect Ether
  const tokenWallet = deployer.address; // Wallet holding the tokens for allowance
  const openingTime = Math.floor(Date.now() / 1000) + 60; // Crowdsale starts in 1 minute
  const closingTime = openingTime + 86400; // Crowdsale ends in 1 day

  const crowdsale = await CrowdsaleFactory.deploy(
    rate,
    wallet,
    token.address,
    openingTime,
    closingTime,
    tokenWallet
  );

  await crowdsale.deployed();

  console.log("Crowdsale deployed to:", crowdsale.address);

  // Grant the minter role to the crowdsale contract
  const minterRole = await token.MINTER_ROLE();
  const tx1 = await token.grantRole(minterRole, crowdsale.address);
  await tx1.wait();

  console.log("Minter role granted to crowdsale contract.");

  // Renounce the deployer's minter role
  const tx2 = await token.renounceRole(minterRole, deployer.address);
  await tx2.wait();

  console.log("Deployer renounced minter role.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
