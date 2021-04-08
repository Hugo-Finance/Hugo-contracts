const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;


const HUGO = artifacts.require('HUGO');

contract('HUGO token fees mechanic tests', function (accounts) {
    const [ initialHolder, recipient, anotherAccount, blackListed1, blackListed2 ] = accounts;

    const initialSupply = new BN(2000000000).mul(new BN(1e9));
    const decimals = 9;
    const feePercentage = 2;

    describe("no black listed users", function() {
        before(async function () {
            this.token = await HUGO.new([blackListed1, blackListed2]);
        });

        const transferAmount = new BN(1000).mul(new BN(1e9));

        it('transferring amount to new user', async function () {
            const cleanAmount = transferAmount.muln(100 - feePercentage).divn(100);
            const fees = transferAmount.muln(feePercentage).divn(100);

            const senderFeesShare = initialSupply.sub(transferAmount).mul(new BN(1e12)).div(initialSupply);
            const senderFees = fees.mul(senderFeesShare).div(new BN(1e12));
            const senderResultBal = initialSupply.sub(transferAmount).add(senderFees);

            await this.token.transfer(recipient, transferAmount.toString(), { from: initialHolder });

            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(senderResultBal.toString());
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(cleanAmount.toString());
            expect(await this.token.distributed()).to.be.bignumber.equal(fees.toString());
        });

        it('transferring amount to holder', async function() {
            const cleanAmount = transferAmount.muln(100 - feePercentage).divn(100);
            const fees = transferAmount.muln(feePercentage).divn(100);

            const senderBeforeBalance = await this.token.balanceOf(initialHolder);
            const senderFeesShare = senderBeforeBalance.sub(transferAmount).mul(new BN(1e12)).div(initialSupply);
            const senderFees = fees.mul(senderFeesShare).div(new BN(1e12));
            const senderResultBal = senderBeforeBalance.sub(transferAmount).add(senderFees);

            const recipientBeforeBalance = await this.token.balanceOf(recipient);
            const recipientFeesShare = recipientBeforeBalance.mul(new BN(1e12)).div(initialSupply);
            const recipientFees = fees.mul(recipientFeesShare).div(new BN(1e12));
            const recipientResultBal = recipientBeforeBalance.add(cleanAmount).add(recipientFees);

            await this.token.transfer(recipient, transferAmount.toString(), {from: initialHolder});

            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(senderResultBal.toString());
            expect(await this.token.balanceOf(recipient)).to.be.bignumber.equal(recipientResultBal.toString());

        });

        it('emits events', async function () {
            const fees = transferAmount.muln(feePercentage).divn(100);

            // fees from previous transfer are being written now
            const collectedFees = await this.token.calculateCollectedFees(initialHolder);
            const receipt = await this.token.transfer(anotherAccount, transferAmount.toString(), { from: initialHolder });

            expectEvent(receipt, 'feesPaid', {
                account: initialHolder,
                amount: fees.toString(),
            });

            expectEvent(receipt, 'feesAccrued', {
                account: initialHolder,
                amount: collectedFees.toString(),
            });
            //
            expect(await this.token.distributed()).to.be.bignumber.equal(fees.muln(3).toString());
        });
    })

    describe("with black listed users", function() {
        before(async function () {
            this.token = await HUGO.new([blackListed1, blackListed2]);
        });

        const transferAmount = new BN(1000).mul(new BN(1e9));

        it('transfer some tokens to black listed user', async function () {
            const cleanAmount = transferAmount.muln(100 - feePercentage).divn(100);
            const fees = transferAmount.muln(feePercentage).divn(100);

            const senderFeesShare = initialSupply.sub(transferAmount).mul(new BN(1e12)).div(initialSupply.sub(cleanAmount));
            const senderFees = fees.mul(senderFeesShare).div(new BN(1e12));
            const senderResultBal = initialSupply.sub(transferAmount).add(senderFees);

            await this.token.transfer(blackListed1, transferAmount.toString(), { from: initialHolder });

            expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(senderResultBal.toString());
            expect(await this.token.balanceOf(blackListed1)).to.be.bignumber.equal(cleanAmount.toString());
            expect(await this.token.distributed()).to.be.bignumber.equal(fees.toString());
        });

        it('black listed user transfer tokens', async function () {
            const transferAmount2 = new BN(500).mul(new BN(1e9));

            const cleanAmount = transferAmount2.muln(100 - feePercentage).divn(100);
            const fees = transferAmount2.muln(feePercentage).divn(100);

            const blackListedBefore = await this.token.balanceOf(blackListed1);
            await this.token.transfer(anotherAccount, transferAmount2.toString(), { from: blackListed1 });

            expect(await this.token.balanceOf(blackListed1)).to.be.bignumber.equal(blackListedBefore.sub(transferAmount2).toString());
            expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal(cleanAmount.toString());
        });

        it('emits events', async function () {
            const fees = transferAmount.muln(feePercentage).divn(100);

            // fees from previous transfer are being written now
            const collectedFees = await this.token.calculateCollectedFees(initialHolder);
            const receipt = await this.token.transfer(anotherAccount, transferAmount.toString(), { from: initialHolder });

            expectEvent(receipt, 'feesPaid', {
                account: initialHolder,
                amount: fees.toString(),
            });

            expectEvent(receipt, 'feesAccrued', {
                account: initialHolder,
                amount: collectedFees.toString(),
            });

            const totalFees = fees.divn(2).add(fees.muln(2));
            expect(await this.token.distributed()).to.be.bignumber.equal(totalFees.toString());
        });
    })


});