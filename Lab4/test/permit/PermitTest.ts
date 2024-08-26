import hre from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "ethers";
import { splitSignature } from "@ethersproject/bytes";

describe("Permit", function () {
  async function deployPermitFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const ERC20TokenPermitMock = await hre.ethers.getContractFactory("ERC20TokenPermitMock");
    const tokenWithPermit = await ERC20TokenPermitMock.deploy("Token", "TKN");
    return { tokenWithPermit, owner, account1, account2 };
  }

  async function getSignature(
    verifyingContract: string,
    signer: HardhatEthersSigner,
    owner: string,
    spender: string,
    value: bigint,
    nonce: bigint,
    deadline: number,
  ) {
    const domain = {
      name: "Token",
      version: "1",
      chainId: 31337,
      verifyingContract: verifyingContract,
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

    const signature = await signer.signTypedData(domain, types, {
      owner: owner,
      spender: spender,
      value: value,
      nonce: nonce,
      deadline: deadline,
    });
    const { v, r, s } = splitSignature(signature);
    return { v, r, s };
  }

  it("should revert when deadline is in the past", async function () {
    const { tokenWithPermit, account1, account2 } = await loadFixture(deployPermitFixture);
    const { v, r, s } = await getSignature(
      await tokenWithPermit.getAddress(),
      account1,
      account1.address,
      account2.address,
      ethers.parseEther("1"),
      await tokenWithPermit.nonces(account1.address),
      Math.floor(Date.now() / 1000) - 1000,
    );

    await expect(
      tokenWithPermit.permit(
        account1.address,
        account2.address,
        ethers.parseEther("1"),
        Math.floor(Date.now() / 1000) - 1000,
        v,
        r,
        s,
      ),
    ).to.be.revertedWithCustomError(tokenWithPermit, "ERC2612ExpiredSignature");
  });

  it("should revert when invalid signature", async function () {
    it("should revert when nonce is incorrect", async function () {
      const { tokenWithPermit, account1, account2 } = await loadFixture(deployPermitFixture);
      const deadline = Math.floor(Date.now() / 1000) + 1000;
      const { v, r, s } = await getSignature(
        await tokenWithPermit.getAddress(),
        account1,
        account1.address,
        account2.address,
        ethers.parseEther("1"),
        (await tokenWithPermit.nonces(account1.address)) + BigInt(1),
        deadline,
      );

      await expect(
        tokenWithPermit.permit(
          account1.address,
          account2.address,
          ethers.parseEther("1"),
          deadline,
          v,
          r,
          s,
        ),
      )
        .to.be.revertedWithCustomError(tokenWithPermit, "ERC2612InvalidSigner")
        .withArgs(account1.address, ethers.parseEther("1"));
    });
  });

  it("should pass with success", async () => {
    const { tokenWithPermit, account1, account2 } = await loadFixture(deployPermitFixture);
    const deadline = Math.floor(Date.now() / 1000) + 1000;
    const { v, r, s } = await getSignature(
      await tokenWithPermit.getAddress(),
      account1,
      account1.address,
      account2.address,
      ethers.parseEther("1"),
      await tokenWithPermit.nonces(account1.address),
      deadline,
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    expect(
      await tokenWithPermit.permit(
        account1.address,
        account2.address,
        ethers.parseEther("1"),
        deadline,
        v,
        r,
        s,
      ),
    ).to.be.ok;

    expect(await tokenWithPermit.allowance(account1.address, account2.address)).to.equal(
      ethers.parseEther("1"),
    );
    expect(await tokenWithPermit.nonces(account1.address)).to.equal(BigInt(1));
  });
});
