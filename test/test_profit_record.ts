import {expect} from "chai";
import {ethers} from "hardhat";

import {about, banlancOf, Coin2Tron, Fixture} from "./utils";
import {Deposit, Income, MERC20, MRelayerRegistry, MTornRouter, ProfitRecord, RootManger} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture, USER_FIX} from "./start_up";
import {BigNumber} from "ethers";

describe("test_income", function () {
    let usdc_erc20: MERC20,torn_erc20: MERC20;


    let mTornRouter :MTornRouter;

    let mDeposit :Deposit;

    let mProfitRecord :ProfitRecord;
    let mIncome :Income;


    let fix_info: Fixture;
    let users :USER_FIX;
    let mRootManger :RootManger;
    let mRelayerRegistry:MRelayerRegistry;
    beforeEach(async () => {
        fix_info = await set_up_fixture("register_relayers");
        users = await get_user_fixture();
        usdc_erc20 = fix_info.usdc_erc20;
        torn_erc20 = fix_info.torn_erc20;
        mTornRouter =fix_info.mTornRouter;
        mDeposit =fix_info.mDeposit;
        mIncome =  fix_info.mIncome;
        mProfitRecord = fix_info.mProfitRecord;
        mRootManger = fix_info.mRootManger;
        mRelayerRegistry = fix_info.mRelayerRegistry;
        await  mDeposit.connect(users.operator).setMaxReservePara(1, ethers.utils.parseUnits("50000",18) );
        await  mDeposit.connect(users.operator).setMaxReservePara(2,ethers.utils.parseUnits("50000",18) );
        await  mDeposit.connect(users.operator).setMaxReservePara(3,users.reward.address );
        await  mDeposit.connect(users.operator).setMaxReservePara(4,200 );

        let stake_torn=ethers.utils.parseUnits("50000000",18);

       await torn_erc20.connect(users.relayer2).approve(mRelayerRegistry.address,stake_torn);
       await torn_erc20.connect(users.relayer2).mint(users.relayer2.address,stake_torn);
       await mRelayerRegistry.connect(users.relayer2).stakeToRelayer(users.relayer2.address,stake_torn);


    });

    it("case1: fisrt newDeposit", async function () {

        let stake_torn = ethers.utils.parseUnits(Math.random()*100+"",23);
        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn.mul(500));
        await torn_erc20.connect(users.user3).approve(mDeposit.address,stake_torn.mul(100));
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn);
        let root_token = mRootManger.balanceOf(users.user3.address);
        expect(await mProfitRecord.connect(users.user3).getProfit(users.user3.address,root_token)).equal(0);


        //deposit eth for test
        let eth = ethers.utils.parseUnits("100000",18);
        let counter = 20

        for(let i = 0 ; i < counter ; i++) {
            await  mTornRouter.connect( users.user1).deposit("eth", eth, {value: eth});
            await  mTornRouter.connect( users.user1).withdraw("eth", eth,  users.user1.address);
        }
        let income_eth = await banlancOf(fix_info,"eth", mIncome);

        let getProfit = await mProfitRecord.connect(users.user3).getProfit(users.user3.address, root_token);
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn.add(getProfit));
        expect(about(await mProfitRecord.connect(users.user3).getProfit(users.user3.address, await mRootManger.balanceOf(users.user3.address)),getProfit)).equal(true);

    });

    it("case2: fisrt newDeposit", async function () {

        await  mDeposit.connect(users.operator).setMaxReservePara(1, ethers.utils.parseUnits("500000000000",18) );
        await  mDeposit.connect(users.operator).setMaxReservePara(2,ethers.utils.parseUnits("5000000000",18) );

        let stake_torn = ethers.utils.parseUnits(Math.random()*100+"",23);
        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn.mul(500));
        await torn_erc20.connect(users.user3).approve(mDeposit.address,stake_torn.mul(100));
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn);
        let root_token = mRootManger.balanceOf(users.user3.address);
        expect(await mDeposit.checkRewardOnGov()).equal(0);
        expect(await mDeposit.balanceOfStakingOnGov()).equal(0);
       await mDeposit.connect(users.operator).stake2Node(0,stake_torn);

        //deposit eth for test
        let eth = ethers.utils.parseUnits("100000",18);
        let counter = 20

        console.log(1,await mDeposit.totalBalanceOfTorn());
        console.log(1,await mRootManger.totalRelayerTorn());

        for(let i = 0 ; i < counter ; i++) {
            await  mTornRouter.connect( users.user1).deposit("eth", eth, {value: eth});
            await  mTornRouter.connect( users.user1).withdraw("eth", eth,  users.user1.address);
        }
        let income_eth = await banlancOf(fix_info,"eth", mIncome);


       await expect(mProfitRecord.connect(users.user3).getProfit(users.user3.address, root_token)).revertedWith("panic code 17");

        let torn =await Coin2Tron(fix_info,"eth",income_eth);
        await mIncome.connect(users.operator).swapETHForTorn(income_eth,torn);
        console.log(await mProfitRecord.connect(users.user3).getProfit(users.user3.address, root_token));

        // for(let i = 0 ; i < counter ; i++) {
        //     await  mTornRouter.connect( users.user1).deposit("eth", eth, {value: eth});
        //     await  mTornRouter.connect( users.user1).withdraw("eth", eth,  users.user1.address);
        // }
        // let income_eth = await banlancOf(fix_info,"eth", mIncome);
        //
        // let getProfit = await mProfitRecord.connect(users.user3).getProfit(users.user3.address, root_token);
        // await mDeposit.connect(users.user3).depositWithApproval(stake_torn.add(getProfit));
        // expect(about(await mProfitRecord.connect(users.user3).getProfit(users.user3.address, await mRootManger.balanceOf(users.user3.address)),getProfit)).equal(true);

    });


});
