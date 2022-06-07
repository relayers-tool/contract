import { expect } from "chai";
import { ethers } from "hardhat";

import {createFixture, Fixture, banlancOf, getGovRelayerReward, Coin2Tron} from "./utils";
import {
    Deposit, ExitQueue, Income,
    MERC20, MockSwap,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    RootManger
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";
describe("test_income", function () {
    let usdc_erc20: MERC20,torn_erc20: MERC20;


    let mTornRouter :MTornRouter;

    let mDeposit :Deposit;

    let mIncome :Income;

    let user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress;

    let fix_info: Fixture;

    beforeEach(async () => {
        fix_info = await createFixture(true);
        usdc_erc20 = fix_info.usdc_erc20;
        torn_erc20 = fix_info.torn_erc20;
        mTornRouter =fix_info.mTornRouter;
        mDeposit =fix_info.mDeposit;
        mIncome =  fix_info.mIncome;
        user1 = fix_info.user1;
        user2 = fix_info.user2;
        user3 = fix_info.user3;
        operator = fix_info.operator;
        stake1 = fix_info.stake1;

        let stake_torn=ethers.utils.parseUnits("50",18);
        await   torn_erc20.connect(  stake1).mint(  stake1.address,stake_torn.mul(1000));

        await torn_erc20.connect(stake1).approve(mDeposit.address,stake_torn);
        await mDeposit.connect(stake1).depositWithApproval(stake_torn);


        let usdc = ethers.utils.parseUnits("1",6);
        await usdc_erc20.connect(user1).mint(user1.address,usdc.mul(1000));


        // deposit usdc for test
         usdc = ethers.utils.parseUnits("1",6);
        await usdc_erc20.connect(user1).approve(mTornRouter.address,usdc);
        await mTornRouter.connect(user1).deposit("usdc",usdc);
        await mTornRouter.connect(user1).withdraw("usdc",usdc,user2.address);

        //deposit eth for test
        let eth = ethers.utils.parseUnits("1000",18);
        await mTornRouter.connect(user1).deposit("eth", eth, {value: eth});
        await mTornRouter.connect(user1).withdraw("eth", eth, user2.address);


    });

    it("test only operator can withdraw", async function () {
         let usdc_value = await banlancOf(fix_info,"usdc",mIncome);
         let eth_value = await banlancOf(fix_info,"eth",mIncome);
         expect(usdc_value.gt(0)).to.be.true;
         expect(eth_value.gt(0)).to.be.true;
         await expect( mIncome.connect(user1).withdraw(usdc_erc20.address,usdc_value)).to.be.revertedWith("Caller is not operator");

         //event
         await expect(mIncome.connect(operator).withdraw(usdc_erc20.address,usdc_value)).to.be.emit(mIncome, "with_draw")
             .withArgs(usdc_erc20.address,operator.address, usdc_value);
         await expect(mIncome.connect(operator).withdraw("0x0000000000000000000000000000000000000000",eth_value)).to.be.emit(mIncome, "with_draw")
             .withArgs("0x0000000000000000000000000000000000000000",operator.address, eth_value);
         expect(await  usdc_erc20.balanceOf(operator.address)).to.equal(usdc_value);

    });

    it("test swap", async function () {
        let eth_value = await banlancOf(fix_info,"eth",mIncome);
        let torn =await Coin2Tron(fix_info,"eth",eth_value);
        await expect( mIncome.connect(user1).swapETHForTorn(eth_value,torn,{value:eth_value})).to.be.revertedWith("Caller is not operator");
        await  expect(mIncome.connect(operator).swapETHForTorn(eth_value,torn)).to.be.revertedWith("unconformity value");
        await  mIncome.connect(operator).swapETHForTorn(eth_value,torn,{value:eth_value});
        expect(await banlancOf(fix_info,"torn",mIncome)).to.gte(torn);
    });

    it("test distribute_torn", async function () {
        let eth_value = await banlancOf(fix_info,"eth",mIncome);
        let torn =await Coin2Tron(fix_info,"eth",eth_value);
        await  mIncome.connect(operator).swapETHForTorn(eth_value,torn,{value:eth_value});
        await expect( mIncome.connect(user1).distributeTorn(torn)).to.be.revertedWith("Caller is not operator");
        await expect(mIncome.connect(operator).distributeTorn(torn)).to.be.emit(mIncome, "distribute_torn")
            .withArgs(mDeposit.address,torn);

    });


});
