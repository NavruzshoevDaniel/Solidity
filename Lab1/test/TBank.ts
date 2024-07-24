import {loadFixture,} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {expect} from "chai";
import hre from "hardhat";

describe("TBank", function () {
  async function deployTBankFixture() {
    const [owner, account1, account2] = await hre.ethers.getSigners();
    const TBank = await hre.ethers.getContractFactory("TBank");
    const tbank = await TBank.deploy(owner);
    return {tbank, owner, account1, account2};
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const {tbank, owner, account1} = await loadFixture(deployTBankFixture);

      expect(await tbank.owner()).to.equal(owner.address);
      expect(await tbank.owner()).to.not.equal(account1.address);
    });
  });

  describe("Deposits", function () {
    it('should deposit and emit event', async function () {
      const {tbank, owner} = await loadFixture(deployTBankFixture);

      await expect(tbank.deposit({value: 100}))
      .to.emit(tbank, "Deposit")
      .withArgs(owner.address, 100)

      expect(await tbank.balanceOf(owner.address)).to.equal(100);
    });
  });

  /* describe("Withdrawals", function () {
     describe("Validations", function () {
       it("Should revert with the right error if called too soon", async function () {
         const {lock} = await loadFixture(deployOneYearLockFixture);

         await expect(lock.withdraw()).to.be.revertedWith(
             "You can't withdraw yet"
         );
       });

       it("Should revert with the right error if called from another account", async function () {
         const {lock, unlockTime, otherAccount} = await loadFixture(
             deployOneYearLockFixture
         );

         // We can increase the time in Hardhat Network
         await time.increaseTo(unlockTime);

         // We use lock.connect() to send a transaction from another account
         await expect(lock.connect(otherAccount).withdraw()).to.be.revertedWith(
             "You aren't the owner"
         );
       });

       it("Shouldn't fail if the unlockTime has arrived and the owner calls it", async function () {
         const {lock, unlockTime} = await loadFixture(
             deployOneYearLockFixture
         );

         // Transactions are sent using the first signer by default
         await time.increaseTo(unlockTime);

         await expect(lock.withdraw()).not.to.be.reverted;
       });
     });

     describe("Events", function () {
       it("Should emit an event on withdrawals", async function () {
         const {lock, unlockTime, lockedAmount} = await loadFixture(
             deployOneYearLockFixture
         );

         await time.increaseTo(unlockTime);

         await expect(lock.withdraw())
         .to.emit(lock, "Withdrawal")
         .withArgs(lockedAmount, anyValue); // We accept any value as `when` arg
       });
     });

     describe("Transfers", function () {
       it("Should transfer the funds to the owner", async function () {
         const {lock, unlockTime, lockedAmount, owner} = await loadFixture(
             deployOneYearLockFixture
         );

         await time.increaseTo(unlockTime);

         await expect(lock.withdraw()).to.changeEtherBalances(
             [owner, lock],
             [lockedAmount, -lockedAmount]
         );
       });
     });
   });*/
});
