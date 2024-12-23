import { expect } from "chai";
import { ethers } from "hardhat";

describe("BEZY Contract", function () {
  let BEZY: any;
  let bezy: any;
  let owner: any;
  let addr1: any;
  let addr2: any;

  before(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy the BEZY contract
    const BEZYFactory = await ethers.getContractFactory("BEZY");
    bezy = await BEZYFactory.deploy(owner.address);
    await bezy.deployed();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await bezy.name()).to.equal("BEZY");
      expect(await bezy.symbol()).to.equal("BEZY");
    });

    it("Should mint the initial supply to the deployer", async function () {
      const totalSupply = await bezy.totalSupply();
      const decimals = await bezy.decimals();
      const expectedSupply = ethers.BigNumber.from(27000000000).mul(ethers.BigNumber.from(10).pow(decimals));

      expect(totalSupply).to.equal(expectedSupply);
      expect(await bezy.balanceOf(owner.address)).to.equal(expectedSupply);
    });

    it("Should set the owner to the deployer address", async function () {
      expect(await bezy.owner()).to.equal(owner.address);
    });
  });

  describe("Minting", function () {
    it("Should allow the owner to mint tokens", async function () {
      const mintAmount = ethers.utils.parseUnits("1000", await bezy.decimals());
      await bezy.connect(owner).mint(addr1.address, mintAmount);

      expect(await bezy.balanceOf(addr1.address)).to.equal(mintAmount);
    });

    it("Should not allow non-owners to mint tokens", async function () {
      const mintAmount = ethers.utils.parseUnits("1000", await bezy.decimals());
      await expect(bezy.connect(addr1).mint(addr1.address, mintAmount)).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transfer and Votes", function () {
    it("Should transfer tokens between accounts", async function () {
      const transferAmount = ethers.utils.parseUnits("500", await bezy.decimals());
      await bezy.connect(addr1).transfer(addr2.address, transferAmount);

      expect(await bezy.balanceOf(addr1.address)).to.equal(
        ethers.utils.parseUnits("500", await bezy.decimals())
      );
      expect(await bezy.balanceOf(addr2.address)).to.equal(transferAmount);
    });

    it("Should update voting power upon transfers", async function () {
      const initialVotesAddr1 = await bezy.getVotes(addr1.address);
      const initialVotesAddr2 = await bezy.getVotes(addr2.address);

      const transferAmount = ethers.utils.parseUnits("200", await bezy.decimals());
      await bezy.connect(addr1).transfer(addr2.address, transferAmount);

      expect(await bezy.getVotes(addr1.address)).to.equal(initialVotesAddr1.sub(transferAmount));
      expect(await bezy.getVotes(addr2.address)).to.equal(initialVotesAddr2.add(transferAmount));
    });
  });

  describe("Permit and Nonces", function () {
    it("Should return the correct nonce for an address", async function () {
      const nonce = await bezy.nonces(owner.address);
      expect(nonce).to.equal(0);
    });

    it("Should update nonce after a permit", async function () {
      const domain = {
        name: "BEZY",
        version: "1",
        chainId: (await ethers.provider.getNetwork()).chainId,
        verifyingContract: bezy.address,
      };

      const types = {
        Permit: [
          { name: "owner", type: "address" },
          { name: "spender", type: "address" },
          { name: "value", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
        ],
      };

      const value = ethers.utils.parseUnits("100", await bezy.decimals());
      const nonce = await bezy.nonces(owner.address);
      const deadline = Math.floor(Date.now() / 1000) + 3600;

      const signature = await owner._signTypedData(domain, types, {
        owner: owner.address,
        spender: addr1.address,
        value,
        nonce,
        deadline,
      });

      const { v, r, s } = ethers.utils.splitSignature(signature);

      await bezy.permit(owner.address, addr1.address, value, deadline, v, r, s);

      expect(await bezy.nonces(owner.address)).to.equal(nonce.add(1));
      expect(await bezy.allowance(owner.address, addr1.address)).to.equal(value);
    });
  });
});
