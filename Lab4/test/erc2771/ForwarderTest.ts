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

    return {
      forwarderContract,
      erc2771Context,
      owner,
      account1,
      account2,
    };
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

  it("should return true when valid request", async function () {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    expect(await forwarderContract.verify(requestTemplate)).to.be.equal(true);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should return false when deadline is in the past", async function () {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2000-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };
    expect(await forwarderContract.verify(requestTemplate)).to.be.equal(false);
  });

  it("should return false when invalid signature", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: Math.floor(Date.parse("2050-01-02") / 1000),
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    expect(await forwarderContract.verify(requestTemplate)).to.be.equal(false);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should return false when target is not trusted because don't have the ERC2771Context interface", async () => {
    const { forwarderContract, account1, account2, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: account2.address,
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    expect(await forwarderContract.verify(requestTemplate)).to.be.equal(false);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should return false when target is not trusted because _isTrustedForwarder is false", async () => {
    const { forwarderContract, account1 } = await loadFixture(deployForwarderFixture);

    const ERC2771ContextMock = await hre.ethers.getContractFactory("ERC2771ContextMock");
    const erc2771ContextWithAnotherForwarder = await ERC2771ContextMock.deploy(account1);
    const hashedData =
      erc2771ContextWithAnotherForwarder.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771ContextWithAnotherForwarder.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    expect(await forwarderContract.verify(requestTemplate)).to.be.equal(false);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should return false when nonce is not correct", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: 1,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    expect(await forwarderContract.verify(requestTemplate)).to.be.equal(false);
  });

  it("should revert when deadline is in the past during execute", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2000-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    await expect(forwarderContract.execute(requestTemplate)).to.be.revertedWithCustomError(
      forwarderContract,
      "ERC2771ForwarderExpiredRequest",
    );
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should revert when request value doesn't match the value sent", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: ethers.parseEther("1"),
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: ethers.parseEther("2"),
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    await expect(forwarderContract.execute(requestTemplate)).to.be.revertedWithCustomError(
      forwarderContract,
      "ERC2771ForwarderMismatchedValue",
    );
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should revert when target is not trusted because don't have the ERC2771Context interface during execute", async () => {
    const { forwarderContract, account1, account2, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const value = ethers.parseEther("1");
    const request = {
      from: account1.address,
      to: account2.address,
      value: value,
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    await expect(
      forwarderContract.execute(requestTemplate, { value: value }),
    ).to.be.revertedWithCustomError(forwarderContract, "ERC2771UntrustfulTarget");
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should revert when target is not trusted because _isTrustedForwarder is false during execute", async () => {
    const { forwarderContract, account1 } = await loadFixture(deployForwarderFixture);

    const ERC2771ContextMock = await hre.ethers.getContractFactory("ERC2771ContextMock");
    const erc2771ContextWithAnotherForwarder = await ERC2771ContextMock.deploy(account1);
    const hashedData =
      erc2771ContextWithAnotherForwarder.interface.encodeFunctionData("testMsgSenderAndData");
    const value = ethers.parseEther("1");
    const request = {
      from: account1.address,
      to: await erc2771ContextWithAnotherForwarder.getAddress(),
      value: value,
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    await expect(
      forwarderContract.execute(requestTemplate, { value: value }),
    ).to.be.revertedWithCustomError(forwarderContract, "ERC2771UntrustfulTarget");
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
  });

  it("should revert when nonce is not correct during execute", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const value = ethers.parseEther("1");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: value,
      gas: 1000000n,
      nonce: (await forwarderContract.nonces(account1.address)) + BigInt(1),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(0);
    await expect(
      forwarderContract.execute(requestTemplate, { value: value }),
    ).to.be.revertedWithCustomError(forwarderContract, "ERC2771ForwarderInvalidSigner");
  });

  it("should revert when signature is not correct during execute due to invalid gas", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const value = ethers.parseEther("1");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: value,
      gas: 1000000n,
      nonce: await forwarderContract.nonces(account1.address),
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
    };

    const signature = await account1.signTypedData(
      {
        name: name,
        version: version,
        chainId: 31337n,
        verifyingContract: account1.address,
      },
      {
        ForwardRequest: [
          { name: "from", type: "address" },
          { name: "to", type: "address" },
          { name: "value", type: "uint256" },
          { name: "gas", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas + BigInt(1),
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    await expect(
      forwarderContract.execute(requestTemplate, { value: value }),
    ).to.be.revertedWithCustomError(forwarderContract, "ERC2771ForwarderInvalidSigner");
  });

  it("should revert when target call reverts", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = erc2771Context.interface.encodeFunctionData("withRevert");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: 0,
      gas: 1000000n,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    await expect(forwarderContract.execute(requestTemplate)).to.be.revertedWith("Test revert");
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(beforeExecute);
  });

  it("should revert when target call reverts with a custom error", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = erc2771Context.interface.encodeFunctionData("withError");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: 0,
      gas: 1000000n,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    await expect(forwarderContract.execute(requestTemplate)).to.be.revertedWithCustomError(
      erc2771Context,
      "TestError",
    );
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(beforeExecute);
  });

  it("should revert when call non exist function", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(["string"], ["nonExistFunction"]),
    );
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: 0,
      gas: 1000000n,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    await expect(forwarderContract.execute(requestTemplate)).to.be.revertedWith(
      "Low-level call failed",
    );
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(beforeExecute);
  });

  it("should call successful without arguments", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: 0,
      gas: 1000000n,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };
    const selectorString = "testMsgSenderAndData()";
    const functionSelector = ethers.id(selectorString).slice(0, 10);

    await expect(await forwarderContract.execute(requestTemplate))
      .to.emit(erc2771Context, "MsgSenderAndData")
      .withArgs(await forwarderContract.getAddress(), functionSelector);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(
      beforeExecute + BigInt(1),
    );
  });

  it("should call successful with arguments", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndDataWithArgs", [
      "test",
    ]);
    // Remove the "0x" prefix and convert to hex
    const addressHex = (await account1.getAddress()).slice(2);
    const finalCalldata = hashedData + addressHex;
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: 0,
      gas: 1000000n,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: finalCalldata,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: request.data,
      signature: signature,
    };

    await expect(await forwarderContract.execute(requestTemplate))
      .to.emit(erc2771Context, "MsgSenderAndData")
      .withArgs(account1.address, hashedData);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(
      beforeExecute + BigInt(1),
    );
  });

  it("should call successful with paybale function", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = erc2771Context.interface.encodeFunctionData("testPayable");
    // Remove the "0x" prefix and convert to hex
    const addressHex = (await account1.getAddress()).slice(2);
    const finalCalldata = hashedData + addressHex;
    const value = ethers.parseEther("1");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: value,
      gas: 1000000n,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: finalCalldata,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: request.data,
      signature: signature,
    };

    await expect(await forwarderContract.execute(requestTemplate, { value: value }))
      .to.emit(erc2771Context, "PayableFunctionCalled")
      .withArgs(account1.address, hashedData, value);
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(
      beforeExecute + BigInt(1),
    );
  });

  it("should revert with zero gas", async () => {
    const { forwarderContract, account1, erc2771Context } =
      await loadFixture(deployForwarderFixture);
    const beforeExecute = await forwarderContract.nonces(account1.address);
    const hashedData = erc2771Context.interface.encodeFunctionData("testMsgSenderAndData");
    const request = {
      from: account1.address,
      to: await erc2771Context.getAddress(),
      value: 0,
      gas: 0,
      nonce: beforeExecute,
      deadline: Math.floor(Date.parse("2050-01-01") / 1000),
      data: hashedData,
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
          { name: "deadline", type: "uint48" },
          { name: "data", type: "bytes" },
        ],
      },
      request,
    );

    const requestTemplate = {
      from: request.from,
      to: request.to,
      value: request.value,
      gas: request.gas,
      deadline: request.deadline,
      data: hashedData,
      signature: signature,
    };

    await expect(forwarderContract.execute(requestTemplate)).to.be.revertedWith(
      "Low-level call failed",
    );
    expect(await forwarderContract.nonces(requestTemplate.from)).to.be.equal(beforeExecute);
  });
});
