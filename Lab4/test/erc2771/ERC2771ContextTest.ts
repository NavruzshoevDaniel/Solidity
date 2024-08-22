import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { ethers } from "ethers";

describe("ERC2771Context", function () {
  async function deployERC2771ContextFixture() {
    const [owner, forwarder, account1] = await hre.ethers.getSigners();
    const ERC2771ContextMock = await hre.ethers.getContractFactory("ERC2771ContextMock");
    const erc2771Context = await ERC2771ContextMock.deploy(forwarder);
    return { erc2771Context, owner, forwarder, account1 };
  }

  it("should return the trusted forwarder", async function () {
    const { erc2771Context, forwarder } = await loadFixture(deployERC2771ContextFixture);

    expect(await erc2771Context.trustedForwarder()).to.equal(forwarder);
  });

  it("should return true for the trusted forwarder", async function () {
    const { erc2771Context, forwarder } = await loadFixture(deployERC2771ContextFixture);

    expect(await erc2771Context.isTrustedForwarder(forwarder)).to.equal(true);
  });

  it("should return false for the untrusted forwarder", async function () {
    const { erc2771Context, account1 } = await loadFixture(deployERC2771ContextFixture);

    expect(await erc2771Context.isTrustedForwarder(account1.address)).to.equal(false);
  });

  it("should emit a MsgSenderAndData event from message sender", async function () {
    const { erc2771Context, account1 } = await loadFixture(deployERC2771ContextFixture);
    const selectorString = "testMsgSenderAndData()";
    const functionSelector = ethers.id(selectorString).slice(0, 10);

    await expect(erc2771Context.connect(account1).testMsgSenderAndData())
      .to.emit(erc2771Context, "MsgSenderAndData")
      .withArgs(account1, functionSelector);
  });

  it("should emit event with data from message forwarder and message data less than 20 bytes", async function () {
    const { erc2771Context, forwarder } = await loadFixture(deployERC2771ContextFixture);
    const selectorString = "testMsgSenderAndData()";
    const functionSelector = ethers.id(selectorString).slice(0, 10);

    await expect(erc2771Context.connect(forwarder).testMsgSenderAndData())
      .to.emit(erc2771Context, "MsgSenderAndData")
      .withArgs(forwarder, functionSelector);
  });

  it("should emit event with data from message forwarder and message data greater than 20 bytes", async function () {
    const { erc2771Context, forwarder } = await loadFixture(deployERC2771ContextFixture);
    const addressToAppend = forwarder.address;
    const iface = new ethers.Interface(["function testMsgSenderAndDataWithArgs(string)"]);
    const encodedFunctionData = iface.encodeFunctionData("testMsgSenderAndDataWithArgs", [
      "hello world",
    ]);

    // Remove the "0x" prefix and convert to hex
    const addressHex = addressToAppend.slice(2);
    const finalCalldata = encodedFunctionData + addressHex;

    await expect(await forwarder.sendTransaction({ to: erc2771Context, data: finalCalldata }))
      .to.emit(erc2771Context, "MsgSenderAndData")
      .withArgs(forwarder, encodedFunctionData);
  });
});
