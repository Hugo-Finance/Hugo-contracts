const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

const {
    shouldBehaveLikeERC20
} = require('./erc20.behaviour');

const HUGO = artifacts.require('HUGO');

contract('BEP20 Token behaviour test', function (accounts) {
    const [ initialHolder, recipient, anotherAccount ] = accounts;

    const name = 'Hugo Finance';
    const symbol = 'HUGO';

    const initialSupply = new BN(2000000000).mul(new BN(1e9));
    const decimals = 9;

    beforeEach(async function () {
        this.token = await HUGO.new([accounts[3], accounts[4]]);
    });

    it('has a name', async function () {
        expect(await this.token.name()).to.equal(name);
    });

    it('has a symbol', async function () {
        expect(await this.token.symbol()).to.equal(symbol);
    });

    it('has 9 decimals', async function () {
        expect(await this.token.decimals()).to.be.bignumber.equal(decimals.toString());
    });

    shouldBehaveLikeERC20('BEP20', initialSupply, initialHolder, recipient, anotherAccount, 2);

    describe('decrease allowance', function () {
        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            function shouldDecreaseApproval (amount) {
                describe('when there was no approved amount before', function () {
                    it('reverts', async function () {
                        await expectRevert(this.token.decreaseAllowance(
                            spender, amount, { from: initialHolder }), 'HUGO::decreaseAllowance: decreased allowance below zero',
                        );
                    });
                });

                describe('when the spender had an approved amount', function () {
                    const approvedAmount = amount;

                    beforeEach(async function () {
                        ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: initialHolder }));
                    });

                    it('emits an approval event', async function () {
                        const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });

                        expectEvent.inLogs(logs, 'Approval', {
                            owner: initialHolder,
                            spender: spender,
                            amount: new BN(0),
                        });
                    });

                    it('decreases the spender allowance subtracting the requested amount', async function () {
                        await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('1');
                    });

                    it('sets the allowance to zero when all allowance is removed', async function () {
                        await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal('0');
                    });

                    it('reverts when more than the full allowance is removed', async function () {
                        await expectRevert(
                            this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder }),
                            'HUGO::decreaseAllowance: decreased allowance below zero',
                        );
                    });
                });
            }

            describe('when the sender has enough balance', function () {
                const amount = initialSupply;

                shouldDecreaseApproval(amount);
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.addn(1);

                shouldDecreaseApproval(amount);
            });
        });

        describe('when the spender is the zero address', function () {
            const amount = initialSupply;
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(this.token.decreaseAllowance(
                    spender, amount, { from: initialHolder }), 'HUGO::decreaseAllowance: decreased allowance below zero',
                );
            });
        });
    });

    describe('increase allowance', function () {
        const amount = initialSupply;

        describe('when the spender is not the zero address', function () {
            const spender = recipient;

            describe('when the sender has enough balance', function () {
                it('emits an approval event', async function () {
                    const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: initialHolder,
                        spender: spender,
                        amount: amount,
                    });
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, new BN(1), { from: initialHolder });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
                    });
                });
            });

            describe('when the sender does not have enough balance', function () {
                const amount = initialSupply.addn(1);

                it('emits an approval event', async function () {
                    const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                    expectEvent.inLogs(logs, 'Approval', {
                        owner: initialHolder,
                        spender: spender,
                        amount: amount,
                    });
                });

                describe('when there was no approved amount before', function () {
                    it('approves the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount);
                    });
                });

                describe('when the spender had an approved amount', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, new BN(1), { from: initialHolder });
                    });

                    it('increases the spender allowance adding the requested amount', async function () {
                        await this.token.increaseAllowance(spender, amount, { from: initialHolder });

                        expect(await this.token.allowance(initialHolder, spender)).to.be.bignumber.equal(amount.addn(1));
                    });
                });
            });
        });

        describe('when the spender is the zero address', function () {
            const spender = ZERO_ADDRESS;

            it('reverts', async function () {
                await expectRevert(
                    this.token.increaseAllowance(spender, amount, { from: initialHolder }), 'HUGO::_approve: cannot approve to the zero address',
                );
            });
        });
    });

});