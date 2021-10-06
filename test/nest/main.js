const {BN, constants, expectEvent, expectRevert} = require('@openzeppelin/test-helpers');
const {expect, use} = require('chai');
const {ZERO_ADDRESS, MAX_UINT256} = constants;

const {
    deployNFT, deployNest, MINTER_ROLE, EGGS_PRICES,
    HUGO_EGG_DISCOUNT, HUGO_DECIMALS, WBNB_DECIMALS,
    HUGO_PRICE, ConsumableLvl, IncubatorLvl, WBNB_PRICE,
    VAULT_LVL_1, VAULT_LVL_2, VAULT_LVL_3, VAULT_RELOAD_TIME
} = require('./utils');

const {
    increaseTime,
    encodeParameters,
    mineBlock,
} = require('../utils/Ethereum');

const HugoNest = artifacts.require('HugoNest');
const HugoNFT = artifacts.require('HugoNFT');
const Pancake = artifacts.require("TestPancake");
const HUGO = artifacts.require('HUGO');


contract('HugoNest main tests', function (accounts) {
    const [owner, beneficiary, user, user2] = accounts;
    let pancake;
    let token;
    let nest;
    let nft;
    const lvl1_deposit = Math.ceil(VAULT_LVL_1 / 0.98);
    const lvl2_deposit = Math.ceil(VAULT_LVL_2 / 0.98);
    const lvl3_deposit = Math.ceil(VAULT_LVL_3 / 0.98);

    describe("Deploy environment", function () {
        it("Deploy test pancake", async function () {
            pancake = await Pancake.new();
        })

        it("Deploy NFT", async function () {
            nft = await deployNFT();
        })

        it("Deploy HUGO", async function () {
            // add all users to blacklist for easier calculations
            token = await HUGO.new([beneficiary, user, user2, owner]);
            await token.transfer(user, 1000000 * HUGO_DECIMALS);
            await token.transfer(user2, 1000000 * HUGO_DECIMALS);

        })

        it("Deploy Nest", async function () {
            nest = await deployNest(
                token.address,
                nft.address,
                pancake.address,
                beneficiary,
                owner
            );
            await token.addToFeeBlackList(nest.address);
        });

        it("Grant NFT mint role to Nest", async function () {
            await nft.grantRole(MINTER_ROLE, nest.address);
        });

    });

    describe("Check shop", function () {
        const eggs_to_buy = [2, 3, 4];
        const eggs_price = EGGS_PRICES.slice(1, 4).reduce((a, b) => a + b);
        let beneficiary_bnb_bal;

        async function checkEggs(_user) {
            const user_data = await nest.getUserData(_user);
            const [egg1, egg2, egg3] = user_data.eggs;
            expect(egg1.body_type).to.be.eq(eggs_to_buy[0].toString());
            expect(egg2.body_type).to.be.eq(eggs_to_buy[1].toString());
            expect(egg3.body_type).to.be.eq(eggs_to_buy[2].toString());

            // also check incubator is spawned
            const [incubator] = user_data.incubators;
            expect(incubator.lvl).to.be.eq(IncubatorLvl.LVL_0.toString());
        }

        describe("Try buying with HUGO", function () {
            it("Approve HUGO", async function () {
                await token.approve(nest.address, MAX_UINT256.toString(), {from: user});
                const allowed = await token.allowance(user, nest.address);
                expect(allowed.toString()).to.be.eq(MAX_UINT256.toString());
            });

            it("Buy with HUGO", async function () {
                // prices
                const prices = await nest.calcPriceInCurrencies(eggs_to_buy);
                const expected_hugo_price = (((eggs_price / HUGO_PRICE) * HUGO_DECIMALS) * HUGO_EGG_DISCOUNT) / 1000;
                expect(prices.hugo_price.toString()).to.be.eq(expected_hugo_price.toString());

                const balance_before = await token.balanceOf(user);
                await nest.buyEggs(eggs_to_buy, 0, {from: user});
                const balance_after = await token.balanceOf(user);

                const delta = balance_before - balance_after;
                expect(delta.toString()).to.be.eq(expected_hugo_price.toString());
            });

            it("Check eggs are bought correctly", async function () {
                await checkEggs(user);
            })

            it("Check beneficiary got HUGOs", async function () {
                bal_after = await token.balanceOf(beneficiary);
                const expected_hugo_price = (((eggs_price / HUGO_PRICE) * HUGO_DECIMALS) * HUGO_EGG_DISCOUNT) / 1000;
                const expected_profit = Math.floor(expected_hugo_price * 98 / 100);

                expect(bal_after.toString()).to.be.eq(expected_profit.toString());
            });
        });

        describe("Try buying with BNB", function () {
            it("Buy with BNB", async function () {
                // prices
                const prices = await nest.calcPriceInCurrencies(eggs_to_buy);
                const expected_bnb_price = (eggs_price / WBNB_PRICE) * WBNB_DECIMALS;
                expect(prices.bnb_price.toString()).to.be.eq(expected_bnb_price.toString());

                beneficiary_bnb_bal = await web3.eth.getBalance(beneficiary);
                const balance_before = await web3.eth.getBalance(user2);
                const tx = await nest.buyEggs(eggs_to_buy, 1, {from: user2, value: expected_bnb_price});
                const balance_after = await web3.eth.getBalance(user2);

                const gas_used = tx.receipt.gasUsed;
                const bnb_spent_for_gas = gas_used * 5000000000; // 5 gwei
                const spent_total = Math.round((expected_bnb_price + bnb_spent_for_gas) / 10**9);
                const delta = Math.round((balance_before - balance_after) / 10**9);

                expect(delta.toString()).to.be.eq(spent_total.toString());
            });

            it("Check eggs are bought correctly", async function () {
                await checkEggs(user2);
            })

            it("Check beneficiary got BNBs", async function () {
                bal_after = await web3.eth.getBalance(beneficiary);
                const expected_bnb_price = (eggs_price / WBNB_PRICE) * WBNB_DECIMALS;
                const bn = new BN(expected_bnb_price.toString(), 10);
                const bn_1 = new BN(beneficiary_bnb_bal.toString(), 10);
                const expected_bal = bn.add(bn_1);

                expect(bal_after.toString()).to.be.eq(expected_bal.toString());
            });
        });
    });

    describe("Check vault", function() {
        it("Check deposit works correctly", async function() {
            const deposit = 49000 * HUGO_DECIMALS;
            const user_bal_before = await token.balanceOf(user);
            const nest_bal_before = await token.balanceOf(nest.address);

            await nest.vaultDeposit(deposit, {from: user});

            const user_bal_after = await token.balanceOf(user);
            const nest_bal_after = await token.balanceOf(nest.address);

            const nest_delta = nest_bal_after - nest_bal_before;
            const delta = user_bal_before - user_bal_after;
            const expected_nest_delta = Math.floor(deposit * 0.98)

            expect(delta.toString()).to.be.eq(deposit.toString());
            expect(nest_delta.toString()).to.be.eq(expected_nest_delta.toString());

            const user_data = await nest.getUserData(user);
            expect(user_data.vault_level).to.be.eq('0');
            expect(user_data.vault_staked_tokens.toString()).to.be.eq(expected_nest_delta.toString());

            await expectRevert(nest.getVaultReward(0, {from: user}), 'HUGO_NEST::getVaultReward: vault is level 0');
        });

        it("Check withdraw works correctly", async function() {
            const user_data = await nest.getUserData(user);
            const vault_bal = user_data.vault_staked_tokens;

            await expectRevert(nest.vaultWithdraw(vault_bal*2), 'HUGO_NEST::vaultWithdraw: amount exceeds deposit');

            const user_bal_before = await token.balanceOf(user);
            await nest.vaultWithdraw(vault_bal.toString(), {from: user});
            const user_bal_after = await token.balanceOf(user);

            const expected_withdraw = Math.floor(vault_bal * 0.98);
            expect((user_bal_after - user_bal_before).toString()).to.be.eq(expected_withdraw.toString());

            const user_data_after = await nest.getUserData(user);
            expect(user_data_after.vault_staked_tokens.toString()).to.be.eq('0');

            const vault_token_bal = await token.balanceOf(nest.address);
            expect(vault_token_bal.toString()).to.be.eq('0');
        })

        describe("Check vault rewards", function() {
            describe('Get level 1 rewards', function() {
                it("Deposit for lvl 1 vault", async function() {
                    const deposit = lvl1_deposit * HUGO_DECIMALS;
                    await nest.vaultDeposit(deposit, {from: user});

                    const user_data = await nest.getUserData(user);
                    const last_block = await web3.eth.getBlock('latest');

                    expect(user_data.vault_level).to.be.eq('1');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                });

                it("Get consumable", async function() {
                    await expectRevert(nest.getVaultReward(0, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await nest.getVaultReward(0, {from: user});
                    const last_block = await web3.eth.getBlock('latest');
                    const user_data = await nest.getUserData(user);

                    expect(user_data.vault_level).to.be.eq('1');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                    expect(user_data.consumables.length).to.be.equal(1);

                    const [new_consumable] = user_data.consumables.slice(-1);
                    expect(new_consumable).to.be.eq('1');
                });

                it("Get incubator", async function() {
                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await nest.getVaultReward(1, {from: user});
                    const last_block = await web3.eth.getBlock('latest');
                    const user_data = await nest.getUserData(user);

                    expect(user_data.vault_level).to.be.eq('1');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                    expect(user_data.incubators.length).to.be.equal(2);

                    const [new_incubator] = user_data.incubators.slice(-1);
                    expect(new_incubator.lvl).to.be.eq(IncubatorLvl.LVL_1.toString());
                    expect(new_incubator.remaining_usages).to.be.eq('5');
                });

                it("Get same incubator again", async function() {
                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: incubator already unlocked');
                })
            });

            describe('Get level 2 rewards', function() {
                it("Deposit for lvl 2 vault", async function() {
                    const deposit = lvl2_deposit * HUGO_DECIMALS;
                    await nest.vaultDeposit(deposit, {from: user});

                    const user_data = await nest.getUserData(user);
                    const last_block = await web3.eth.getBlock('latest');

                    expect(user_data.vault_level).to.be.eq('2');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                });

                it("Get consumable", async function() {
                    await expectRevert(nest.getVaultReward(0, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await nest.getVaultReward(0, {from: user});
                    const last_block = await web3.eth.getBlock('latest');
                    const user_data = await nest.getUserData(user);

                    expect(user_data.vault_level).to.be.eq('2');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                    expect(user_data.consumables.length).to.be.equal(2);

                    const [new_consumable] = user_data.consumables.slice(-1);
                    expect(new_consumable).to.be.eq('2');
                });

                it("Get incubator", async function() {
                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await nest.getVaultReward(1, {from: user});
                    const last_block = await web3.eth.getBlock('latest');
                    const user_data = await nest.getUserData(user);

                    expect(user_data.vault_level).to.be.eq('2');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                    expect(user_data.incubators.length).to.be.equal(3);

                    const [new_incubator] = user_data.incubators.slice(-1);
                    expect(new_incubator.lvl).to.be.eq(IncubatorLvl.LVL_2.toString());
                    expect(new_incubator.remaining_usages).to.be.eq('5');
                });

                it("Get same incubator again", async function() {
                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: incubator already unlocked');
                })
            });

            describe('Get level 3 rewards', function() {
                it("Deposit for lvl 3 vault", async function() {
                    const deposit = lvl3_deposit * HUGO_DECIMALS;
                    await nest.vaultDeposit(deposit, {from: user});

                    const user_data = await nest.getUserData(user);
                    const last_block = await web3.eth.getBlock('latest');

                    expect(user_data.vault_level).to.be.eq('3');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                });

                it("Get consumable", async function() {
                    await expectRevert(nest.getVaultReward(0, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await nest.getVaultReward(0, {from: user});
                    const last_block = await web3.eth.getBlock('latest');
                    const user_data = await nest.getUserData(user);

                    expect(user_data.vault_level).to.be.eq('3');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                    expect(user_data.consumables.length).to.be.equal(3);

                    const [new_consumable] = user_data.consumables.slice(-1);
                    expect(new_consumable).to.be.eq('3');
                });

                it("Get incubator", async function() {
                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await nest.getVaultReward(1, {from: user});
                    const last_block = await web3.eth.getBlock('latest');
                    const user_data = await nest.getUserData(user);

                    expect(user_data.vault_level).to.be.eq('3');
                    expect(user_data.vault_reward_at).to.be.eq((last_block.timestamp + VAULT_RELOAD_TIME).toString());
                    expect(user_data.incubators.length).to.be.equal(4);

                    const [new_incubator] = user_data.incubators.slice(-1);
                    expect(new_incubator.lvl).to.be.eq(IncubatorLvl.LVL_3.toString());
                    expect(new_incubator.remaining_usages).to.be.eq('5');
                });

                it("Get same incubator again", async function() {
                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: vault is reloading');
                    await increaseTime(VAULT_RELOAD_TIME + 1);

                    await expectRevert(nest.getVaultReward(1, {from: user}), 'HUGO_NEST::getVaultReward: incubator already unlocked');
                })
            });

        })
    });

    describe("Check incubators", function() {

    });

    describe("Check consumables", function() {

    });

    describe("Check hatch", function() {
        this.timeout(150000);

        it("Hatch egg", async function() {
            await nest.useIncubator(0, 0, {from: user});
            await increaseTime(VAULT_RELOAD_TIME * 2);
            await nest.hatchEgg(0, [0, 0, 0, 0, 0 ,0], 'name', 'description', {from: user});
        });
    });
});