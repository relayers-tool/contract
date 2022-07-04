import {expect} from "chai";
import {ethers} from "hardhat";

import {about, almost, banlancOf, Coin2Tron, Fixture, getAllRelayerReward, getGovStakingReward} from "./utils";
import {
    Deposit,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornRouter,
    ProfitRecord,
    RootDB
} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture, USER_FIX} from "./start_up";
import {BigNumber} from "ethers";

describe("test_ProfitRecord", function () {
    let usdc_erc20: MERC20,torn_erc20: MERC20;


    let mTornRouter :MTornRouter;

    let mDeposit :Deposit;

    let mProfitRecord :ProfitRecord;
    let mIncome :Income;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;

    let fix_info: Fixture;
    let users :USER_FIX;
    let mRootDb :RootDB;
    let mRelayerRegistry:MRelayerRegistry;
    beforeEach(async () => {
        fix_info = await set_up_fixture("test_net");
        users = await get_user_fixture();
        usdc_erc20 = fix_info.usdc_erc20;
        torn_erc20 = fix_info.torn_erc20;
        mTornRouter =fix_info.mTornRouter;
        mDeposit =fix_info.mDeposit;
        mIncome =  fix_info.mIncome;
        mProfitRecord = fix_info.mProfitRecord;
        mRootDb = fix_info.mRootDb;
        mRelayerRegistry = fix_info.mRelayerRegistry;
        mTornadoGovernanceStaking = fix_info.mTornadoGovernanceStaking;
        await  mDeposit.connect(users.operator).setPara(1, ethers.utils.parseUnits("50000",18) );
        await  mDeposit.connect(users.operator).setPara(2,ethers.utils.parseUnits("50000",18) );
        await  mDeposit.connect(users.operator).setPara(3,users.reward.address );
        await  mDeposit.connect(users.operator).setPara(4,200 );

        let stake_torn=ethers.utils.parseUnits("50000000",18);

        // await torn_erc20.connect(users.relayer2).mint(users.relayer2.address,stake_torn.mul(1000));
        // await torn_erc20.connect(users.dao_relayer1).mint(users.dao_relayer1.address,stake_torn.mul(1000));

        await torn_erc20.connect(users.relayer2).approve(mRelayerRegistry.address,stake_torn.mul(5000));
        await mRelayerRegistry.connect(users.relayer2).register(users.relayer2.address, 0);

        await torn_erc20.connect(users.dao_relayer1).approve(mRelayerRegistry.address,stake_torn.mul(600));
        await mRelayerRegistry.connect(users.dao_relayer1).register(users.dao_relayer1.address, 0);


        await mRootDb.connect(users.owner).addRelayer(users.dao_relayer1.address, 0);
        await mRootDb.connect(users.owner).addRelayer(users.relayer2.address, 1);



    });

    it("case1: newDeposit", async function () {

        let stake_torn = ethers.utils.parseUnits("50000",18);
        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn.mul(50000));
        await torn_erc20.connect(users.user3).approve(mDeposit.address,stake_torn.mul(10000));
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn.add(5000));
        await  mDeposit.connect(users.operator).setPara(1, stake_torn.mul(5000) );
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn.mul(500));
        await mDeposit.connect(users.operator).stake2Node(0,stake_torn.mul(250));
        await mDeposit.connect(users.operator).stake2Node(1,stake_torn.mul(250));
        let root_token = mRootDb.balanceOf(users.user3.address);
        expect(almost(await mProfitRecord.connect(users.user3).getProfit(users.user3.address,root_token),BigNumber.from(0))).true;


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
        expect(about(await mProfitRecord.connect(users.user3).getProfit(users.user3.address, await mRootDb.balanceOf(users.user3.address)),getProfit)).equal(true);

    });

    it("case2: fisrt newDeposit", async function () {

        await  mDeposit.connect(users.operator).setPara(1, ethers.utils.parseUnits("500000000000",18) );

        let stake_torn = ethers.utils.parseUnits(Math.random()*100+"",23);
        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn.mul(500));
        await torn_erc20.connect(users.user3).approve(mDeposit.address,stake_torn.mul(100));

        await  mDeposit.connect(users.operator).setPara(1, stake_torn.sub(500));

        await mDeposit.connect(users.user3).depositWithApproval(stake_torn);
        expect(await mDeposit.balanceOfStakingOnGov()).equal(stake_torn);

        await  mDeposit.connect(users.operator).setPara(1, ethers.utils.parseUnits("500000000000",18) );
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn);


        await mDeposit.connect(users.operator).stake2Node(0,stake_torn.div(3));
        await mDeposit.connect(users.operator).stake2Node(1,stake_torn.div(3));

        let root_token = mRootDb.balanceOf(users.user3.address);
        expect(await mDeposit.checkRewardOnGov()).equal(0);

       await mDeposit.connect(users.operator).stake2Node(0,stake_torn.div(3));

        //deposit eth for test
        let eth = ethers.utils.parseUnits("100000",18);
        let counter = 20

        for(let i = 0 ; i < counter ; i++) {
            await  mTornRouter.connect( users.user1).deposit("eth", eth, {value: eth});
            await  mTornRouter.connect( users.user1).withdraw("eth", eth,  users.user1.address);
        }
        let income_eth = await banlancOf(fix_info,"eth", mIncome);

       await expect(mProfitRecord.connect(users.user3).getProfit(users.user3.address, root_token)).revertedWith("panic code 17");


    });


    it("case3:  newDeposit", async function () {

        await  mDeposit.connect(users.operator).setPara(1, ethers.utils.parseUnits("500000000000",18) );

        let stake_torn = ethers.utils.parseUnits("5000",18);
        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn.mul(500));
        await torn_erc20.connect(users.user3).approve(mDeposit.address,stake_torn.mul(100));

        await mDeposit.connect(users.user3).depositWithApproval(stake_torn);
        expect(await mDeposit.balanceOfStakingOnGov()).equal(0);
        expect(await mDeposit.checkRewardOnGov()).equal(0);

        await mDeposit.connect(users.operator).stake2Node(0,stake_torn.div(3));
        await mDeposit.connect(users.operator).stake2Node(1,stake_torn.div(3));

        let root_token = mRootDb.balanceOf(users.user3.address);

        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn);
        await torn_erc20.connect(users.user3).approve(mTornadoGovernanceStaking.address,stake_torn);
        await  mTornadoGovernanceStaking.connect(users.user3).lockWithApproval(stake_torn);

        //deposit eth for test
        let eth = ethers.utils.parseUnits("1000",18);
        let counter = 20

        let lastTorn =  await mRootDb.totalTorn()

        for(let i = 0 ; i < counter ; i++) {
            await  mTornRouter.connect( users.user1).deposit("eth", eth, {value: eth});
            await  mTornRouter.connect( users.user1).withdraw("eth", eth,  users.user1.address);
        }

        let relayer_reward = await getAllRelayerReward(fix_info,"eth",eth.mul(20));
        let staking_reward = await getGovStakingReward(fix_info,"eth",eth.mul(20));
        let staking_reward_torn = staking_reward.mul(2000).div(35);
        expect(about(staking_reward_torn,await mTornadoGovernanceStaking.checkReward(users.user3.address))).true;
        let relayer_reward_torn = relayer_reward.mul(2000).div(35);
        await torn_erc20.mint(mIncome.address,relayer_reward_torn);
        let profit = await mProfitRecord.connect(users.user3).getProfit(users.user3.address,root_token);
        expect(about(profit,relayer_reward_torn.sub(staking_reward_torn))).true;


        //prepare to withdraw
        await torn_erc20.connect(users.user2).mint(users.user2.address,stake_torn.mul(500));
        await torn_erc20.connect(users.user2).approve(mDeposit.address,stake_torn.mul(100));
        await mDeposit.connect(users.user2).depositWithApproval(stake_torn.mul(3));

        let last_banlance = await torn_erc20.balanceOf(users.user3.address);
        await mDeposit.connect(users.user3).withDraw(root_token);
        let this_banlance = await torn_erc20.balanceOf(users.user3.address);
        expect(about(this_banlance.sub(last_banlance).sub(stake_torn),profit.mul(800).div(1000))).true;
        expect(about(profit.mul(200).div(1000),await torn_erc20.balanceOf(users.reward.address))).true;


    });
    it("case4:  test onlyDepositContract", async function () {
        await expect(mProfitRecord.connect(users.user3).withDraw(users.user3.address,500)).revertedWith("Caller is not depositContract");
        await expect(mProfitRecord.connect(users.user3).Deposit(users.user3.address,500,200)).revertedWith("Caller is not depositContract");
    })



});
