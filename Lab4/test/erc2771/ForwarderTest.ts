import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import hre from "hardhat";
import { expect } from "chai";
import { ethers } from "ethers";

const name = "Test Forwarder";
const version = "1";

describe("ERC2771Forwarder", function () {
  async function deployForwarderFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const ERC2771Forwarder = await hre.ethers.getContractFactory("ERC2771Forwarder");
    const forwarderContract = await ERC2771Forwarder.deploy(name, version);

    const ERC2771ContextMock = await hre.ethers.getContractFactory("ERC2771ContextMock");
    const erc2771Context = await ERC2771ContextMock.deploy(forwarderContract);
    return { forwarderContract, erc2771Context, owner, account1, account2 };
  }

  it("should check eip712Domain", async function () {
    const { forwarderContract } = await loadFixture(deployForwarderFixture);
    const domain = await forwarderContract.eip712Domain();

    expect(domain.fields).to.equal("0x0f");
    expect(domain.name).to.equal(name);
    expect(domain.version).to.equal(version);
    expect(domain.chainId).to.equal(31337);
    expect(domain.verifyingContract).to.equal(await forwarderContract.getAddress());
    expect(domain.salt).to.equal("0x" + "0".repeat(64));
    expect(domain.extensions).to.deep.equal([]);
  });

  it("should return false when deadline is in the past", async function () {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const nonce = await forwarderContract.nonces(account1.address);
    console.log("nonce", nonce);
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: nonce,
      deadline: Math.floor(Date.parse("2025-01-01") / 1000),
      data: "0x",
    };

    const signature = await account1.signTypedData(
      {
        name: name,
        version: version,
        chainId: 31337n,
        verifyingContract: await forwarderContract.getAddress(),
      },
      {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );
    expect(
      await forwarderContract.verify({
        from: request.from,
        to: request.to,
        value: request.value,
        gas: request.gas,
        deadline: request.deadline,
        data: request.data,
        signature: signature,
      }),
    ).to.be.equal(account1.address);
  });
});
