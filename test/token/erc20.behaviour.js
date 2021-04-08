const { BN, constants, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');
const { ZERO_ADDRESS } = constants;

function shouldBehaveLikeERC20 (errorPrefix, initialSupply, initialHolder, recipient, anotherAccount, feePercentage) {
    describe('total supply', function () {
        it('returns the total amount of tokens', async function () {
            expect(await this.token.totalSupply()).to.be.bignumber.equal(initialSupply);
        });
    });

    describe('balanceOf', function () {
        describe('when the requested account has no tokens', function () {
            it('returns zero', async function () {
                expect(await this.token.balanceOf(anotherAccount)).to.be.bignumber.equal('0');
            });
        });

        describe('when the requested account has some tokens', function () {
            it('returns the total amount of tokens', async function () {
                expect(await this.token.balanceOf(initialHolder)).to.be.bignumber.equal(initialSupply);
            });
        });
    });

    describe('transfer', function () {
        shouldBehaveLikeERC20Transfer(errorPrefix, initialHolder, recipient, initialSupply, feePercentage,
            function (from, to, value) {
                return this.token.transfer(to, value, { from });
            },
        );
    });

    describe('transfer from', function () {
        const spender = recipient;

        describe('when the token owner is not the zero address', function () {
            const tokenOwner = initialHolder;

            describe('when the recipient is not the zero address', function () {
                const to = anotherAccount;

                describe('when the spender has enough approved balance', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, initialSupply.addn(2), { from: initialHolder });
                    });

                    describe('when the token owner has enough balance', function () {
                        const amount = initialSupply;

                        it('transfers the requested amount', async function () {
                            const fees = amount.muln(feePercentage).divn(100);
                            const recipientBalance = amount.sub(fees);

                            await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

                            expect(await this.token.balanceOf(tokenOwner)).to.be.bignumber.equal('0');

                            expect(await this.token.balanceOf(to)).to.be.bignumber.equal(recipientBalance.toString());
                        });

                        it('decreases the spender allowance', async function () {
                            await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

                            expect(await this.token.allowance(tokenOwner, spender)).to.be.bignumber.equal('2');
                        });

                        it('emits a transfer event', async function () {
                            const { logs } = await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

                            expectEvent.inLogs(logs, 'Transfer', {
                                from: tokenOwner,
                                to: to,
                                amount: amount.muln(100 - feePercentage).divn(100),
                            });
                        });

                        it('emits an approval event', async function () {
                            const { logs } = await this.token.transferFrom(tokenOwner, to, amount, { from: spender });

                            expectEvent.inLogs(logs, 'Approval', {
                                owner: tokenOwner,
                                spender: spender,
                                amount: await this.token.allowance(tokenOwner, spender),
                            });
                        });
                    });

                    describe('when the token owner does not have enough balance', function () {
                        const amount = initialSupply.addn(1);

                        it('reverts', async function () {
                            await expectRevert(this.token.transferFrom(
                                tokenOwner, to, amount, { from: spender }), `HUGO::_transferTokens: transfer amount exceeds balance`,
                            );
                        });
                    });
                });

                describe('when the spender does not have enough approved balance', function () {
                    beforeEach(async function () {
                        await this.token.approve(spender, initialSupply.subn(1), { from: tokenOwner });
                    });

                    describe('when the token owner has enough balance', function () {
                        const amount = initialSupply;

                        it('reverts', async function () {
                            await expectRevert(this.token.transferFrom(
                                tokenOwner, to, amount, { from: spender }), `HUGO::transferFrom: transfer amount exceeds spender allowance`,
                            );
                        });
                    });

                    describe('when the token owner does not have enough balance', function () {
                        const amount = initialSupply.addn(1);

                        it('reverts', async function () {
                            await expectRevert(this.token.transferFrom(
                                tokenOwner, to, amount, { from: spender }), `HUGO::transferFrom: transfer amount exceeds spender allowance`,
                            );
                        });
                    });
                });
            });

            describe('when the recipient is the zero address', function () {
                const amount = initialSupply;
                const to = ZERO_ADDRESS;

                beforeEach(async function () {
                    await this.token.approve(spender, amount, { from: tokenOwner });
                });

                it('reverts', async function () {
                    await expectRevert(this.token.transferFrom(
                        tokenOwner, to, amount, { from: spender }), `HUGO::_transferTokens: cannot transfer to the zero address`,
                    );
                });
            });
        });

        describe('when the token owner is the zero address', function () {
            const amount = 0;
            const tokenOwner = ZERO_ADDRESS;
            const to = recipient;

            it('reverts', async function () {
                await expectRevert(this.token.transferFrom(
                    tokenOwner, to, amount, { from: spender }), `HUGO::_transferTokens: cannot transfer from the zero address`,
                );
            });
        });
    });

    describe('approve', function () {
        shouldBehaveLikeERC20Approve(errorPrefix, initialHolder, recipient, initialSupply,
            function (owner, spender, amount) {
                return this.token.approve(spender, amount, { from: owner });
            },
        );
    });
}

function shouldBehaveLikeERC20Transfer (errorPrefix, from, to, balance, feePercentage, transfer) {
    describe('when the recipient is not the zero address', function () {
        describe('when the sender does not have enough balance', function () {
            const amount = balance.addn(1);

            it('reverts', async function () {
                await expectRevert(transfer.call(this, from, to, amount),
                    `HUGO::_transferTokens: transfer amount exceeds balance`,
                );
            });
        });

        describe('when the sender transfers all balance', function () {
            const amount = balance;

            it('transfers the requested amount', async function () {
                const fees = amount.muln(feePercentage).divn(100);
                const receivedFees = fees.muln(100 - feePercentage).divn(100);
                const recipientBalance = amount.sub(fees);

                await transfer.call(this, from, to, amount);

                expect(await this.token.balanceOf(from)).to.be.bignumber.equal('0');

                expect(await this.token.balanceOf(to)).to.be.bignumber.equal(recipientBalance.toString());
            });

            it('emits a transfer event', async function () {
                const { logs } = await transfer.call(this, from, to, amount);

                expectEvent.inLogs(logs, 'Transfer', {
                    from,
                    to,
                    amount: amount.muln(100 - feePercentage).divn(100),
                });
            });
        });

        describe('when the sender transfers zero tokens', function () {
            const amount = new BN('0');

            it('transfers the requested amount', async function () {
                await transfer.call(this, from, to, amount);

                expect(await this.token.balanceOf(from)).to.be.bignumber.equal(balance);

                expect(await this.token.balanceOf(to)).to.be.bignumber.equal('0');
            });

            it('emits a transfer event', async function () {
                const { logs } = await transfer.call(this, from, to, amount);

                expectEvent.inLogs(logs, 'Transfer', {
                    from,
                    to,
                    amount: amount,
                });
            });
        });
    });

    describe('when the recipient is the zero address', function () {
        it('reverts', async function () {
            await expectRevert(transfer.call(this, from, ZERO_ADDRESS, balance),
                `HUGO::_transferTokens: cannot transfer to the zero address`,
            );
        });
    });
}

function shouldBehaveLikeERC20Approve (errorPrefix, owner, spender, supply, approve) {
    describe('when the spender is not the zero address', function () {
        describe('when the sender has enough balance', function () {
            const amount = supply;

            it('emits an approval event', async function () {
                const { logs } = await approve.call(this, owner, spender, amount);

                expectEvent.inLogs(logs, 'Approval', {
                    owner: owner,
                    spender: spender,
                    amount: amount,
                });
            });

            describe('when there was no approved amount before', function () {
                it('approves the requested amount', async function () {
                    await approve.call(this, owner, spender, amount);

                    expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(amount);
                });
            });

            describe('when the spender had an approved amount', function () {
                beforeEach(async function () {
                    await approve.call(this, owner, spender, new BN(1));
                });

                it('reverts', async function () {
                    await expectRevert(approve.call(this, owner, spender, amount),
                        `HUGO::approve: should set allowance to zero first`,
                    );
                });

                it('approves to zero first then set new one', async function () {
                    await approve.call(this, owner, spender, '0');
                    await approve.call(this, owner, spender, amount);

                    expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(amount);
                });
            });
        });

        describe('when the sender does not have enough balance', function () {
            const amount = supply.addn(1);

            it('emits an approval event', async function () {
                const { logs } = await approve.call(this, owner, spender, amount);

                expectEvent.inLogs(logs, 'Approval', {
                    owner: owner,
                    spender: spender,
                    amount: amount,
                });
            });

            describe('when there was no approved amount before', function () {
                it('approves the requested amount', async function () {
                    await approve.call(this, owner, spender, amount);

                    expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(amount);
                });
            });

            describe('when the spender had an approved amount', function () {
                beforeEach(async function () {
                    await approve.call(this, owner, spender, new BN(1));
                });

                it('reverts', async function () {
                    await expectRevert(approve.call(this, owner, spender, amount),
                        `HUGO::approve: should set allowance to zero first`,
                    );
                });

                it('approves to zero first then set new one', async function () {
                    await approve.call(this, owner, spender, '0');
                    await approve.call(this, owner, spender, amount);

                    expect(await this.token.allowance(owner, spender)).to.be.bignumber.equal(amount);
                });
            });
        });
    });

    describe('when the spender is the zero address', function () {
        it('reverts', async function () {
            await expectRevert(approve.call(this, owner, ZERO_ADDRESS, supply),
                `HUGO::_approve: cannot approve to the zero address`,
            );
        });
    });
}

module.exports = {
    shouldBehaveLikeERC20,
    shouldBehaveLikeERC20Transfer,
    shouldBehaveLikeERC20Approve,
};