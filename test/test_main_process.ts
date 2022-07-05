import {expect} from "chai";
import {ethers} from "hardhat";

import {about, banlancOf, Fixture, getAllRelayerReward, TornUserSimulate} from "./utils";
import {
    Deposit,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornRouter, ProfitRecord,
    RootDB
} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture, USER_FIX} from "./start_up";
import {BigNumber} from "ethers";

describe("main_process", function () {
    let usdc_erc20: MERC20, torn_erc20: MERC20;
    let mTornadoGovernanceStaking: MTornadoGovernanceStaking;
    let mRelayerRegistry: MRelayerRegistry;


    let mTornRouter: MTornRouter;
    let mRootDb: RootDB;
    let mDeposit: Deposit;

    let mIncome: Income;
    let relayer1: SignerWithAddress;
    let relayer2: SignerWithAddress, relayer3: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress,
        user3: SignerWithAddress, operator: SignerWithAddress;
    let stake1: SignerWithAddress, stake2: SignerWithAddress;
    let mProfitRecord :ProfitRecord;
    let fix_info: Fixture;
    let users: USER_FIX;
    beforeEach(async () => {
        users = await get_user_fixture()

        fix_info = await set_up_fixture("test_net");
        usdc_erc20 = fix_info.usdc_erc20;
        torn_erc20 = fix_info.torn_erc20;
        mTornadoGovernanceStaking = fix_info.mTornadoGovernanceStaking;
        mRelayerRegistry = fix_info.mRelayerRegistry;
        mTornRouter = fix_info.mTornRouter;
        mRootDb = fix_info.mRootDb;
        mDeposit = fix_info.mDeposit;
        mIncome = fix_info.mIncome;
        relayer1 = users.relayer1;
        relayer2 = users.relayer2;
        relayer3 = users.relayer3;
        user1 = users.user1;
        user2 = users.user2;
        operator = users.operator;
        stake1 = users.stake1;
        stake2 = users.stake2;
        mProfitRecord = fix_info.mProfitRecord;






    });


    describe('main_process', () => {
        it("main_process1", async function () {

            //register relayers
            //give torn to relayers
            await torn_erc20.mint(relayer1.address, ethers.utils.parseUnits("100000000000", 18));
            await torn_erc20.mint(relayer2.address, ethers.utils.parseUnits("100000000000", 18));
            await torn_erc20.mint(relayer3.address, ethers.utils.parseUnits("100000000000", 18));


            // await  torn_erc20.connect( relayer2).approve( mRelayerRegistry.address,stake_value);
            // await  mRelayerRegistry.connect( relayer2).register( relayer2.address,stake_value);


            await torn_erc20.mint(user1.address, ethers.utils.parseUnits("10000", 18));
            await torn_erc20.mint(user2.address, ethers.utils.parseUnits("10000", 18));
            await torn_erc20.mint(stake1.address, ethers.utils.parseUnits("10000", 18));
            await torn_erc20.mint(stake2.address, ethers.utils.parseUnits("10000", 18));


            let stake_value = ethers.utils.parseUnits("5000", 18);
            await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address, stake_value);
            await mRelayerRegistry.connect(relayer1).register(relayer1.address, stake_value);

            stake_value = ethers.utils.parseUnits("5000", 18);
            await usdc_erc20.mint(user1.address, stake_value);

            let stake_torn = ethers.utils.parseUnits("50", 18);
            await torn_erc20.connect(stake1).approve(mTornadoGovernanceStaking.address, stake_torn);
            await mTornadoGovernanceStaking.connect(stake1).stake(stake_torn);
            // avoid to stake to govstaking
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(10000000));
            await mDeposit.connect(operator).setPara(2, stake_torn.mul(10000000));
            expect(await mTornadoGovernanceStaking.connect(stake1).balanceOf(stake1.address)).to.equal(stake_torn);
            expect(await mTornadoGovernanceStaking.connect(stake2).balanceOf(stake2.address)).to.equal(0);
            await torn_erc20.connect(stake2).approve(mDeposit.address, stake_torn);
            await mDeposit.connect(stake2).depositWithApproval(stake_torn);
            expect(stake_torn).to.equal(await mRootDb.connect(stake2).balanceOfTorn(stake2.address));
            // deposit usdc for test
            let usdc = ethers.utils.parseUnits("1", 6);
            await usdc_erc20.connect(user1).approve(mTornRouter.address, usdc);
            await mTornRouter.connect(user1).deposit("usdc", usdc);
            await mTornRouter.connect(user1).withdraw("usdc", usdc, user2.address);


            let income = await banlancOf(fix_info, "usdc", relayer1);
            let reward = await getAllRelayerReward(fix_info, "usdc", usdc);
            expect(income).to.equal(reward);
            let banlance1 = await banlancOf(fix_info, "eth", relayer1);

            //deposit eth for test
            let eth = ethers.utils.parseUnits("1000", 18);
            let counter = 20

            let ret = await TornUserSimulate(fix_info, "eth", eth, BigNumber.from(counter), true);
            expect((await banlancOf(fix_info, "eth", relayer1)).sub(banlance1)).to.equal(await getAllRelayerReward(fix_info, "eth", eth.mul(20)));

        });


        it("main_process2", async function () {

            let stake_torn = ethers.utils.parseUnits(Math.random() * 1000000 + "", 18);
            await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address, stake_torn.mul(10000000));
            await torn_erc20.connect(stake1).approve(mTornadoGovernanceStaking.address, stake_torn.mul(10000000));

            await torn_erc20.mint(relayer1.address, stake_torn.mul(10000000));
            await torn_erc20.mint(relayer2.address,  stake_torn.mul(10000000));
            await torn_erc20.mint(relayer3.address, stake_torn.mul(10000000));

            await torn_erc20.mint(stake1.address, stake_torn.mul(10000000));
            await torn_erc20.mint(stake2.address,  stake_torn.mul(10000000));

            await mRelayerRegistry.connect(relayer1).register(relayer1.address, stake_torn);
            await mRelayerRegistry.connect(relayer1).register(relayer2.address, 0);
            await mRelayerRegistry.connect(relayer1).register(relayer3.address, 0);

            expect(await mRelayerRegistry.connect(relayer1).getRelayerBalance(relayer1.address)).equal(stake_torn);

            await mRootDb.connect(users.owner).addRelayer(relayer2.address,0);
            await mRootDb.connect(users.owner).addRelayer(relayer3.address,1);

            await torn_erc20.connect(stake1).approve(mDeposit.address, stake_torn.mul(10000000));
            await torn_erc20.connect(stake2).approve(mDeposit.address, stake_torn.mul(10000000));

            await mDeposit.connect(operator).setPara(1,stake_torn.mul(10000000));

            await mDeposit.connect(stake1).depositWithApproval(stake_torn);
            await mDeposit.connect(stake2).depositWithApproval(stake_torn);

            await mDeposit.connect(operator).stake2Node(0,stake_torn);
            await mDeposit.connect(operator).stake2Node(1,stake_torn);

            await mDeposit.connect(operator).setPara(1,0);
            await mTornadoGovernanceStaking.connect(stake1).stake(stake_torn);
            await mDeposit.connect(stake2).depositWithApproval(stake_torn);

            expect(await mDeposit.balanceOfStakingOnGov()).equal(stake_torn);
            expect(await mRootDb.totalRelayerTorn()).equal(stake_torn.mul(2));
            expect(await mDeposit.checkRewardOnGov()).equal(0);

            let eth = ethers.utils.parseUnits("1000", 18);
            let counter = 20
            let ret = await TornUserSimulate(fix_info,"eth",eth,BigNumber.from(counter),false);

            expect(about(ret.gov_rev_torn.div(2),(await  mDeposit.checkRewardOnGov()))).true;
            expect(about(ret.gov_rev_torn,(stake_torn.mul(3).sub(await mRelayerRegistry.getRelayerBalance(relayer1.address)).sub(await mRootDb.totalRelayerTorn())))).true;

        });



        it("main_process3", async function () {

            let stake_torn = ethers.utils.parseUnits(Math.random() * 1000000 + "", 18);
            await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address, stake_torn.mul(10000000));
            await torn_erc20.connect(stake1).approve(mTornadoGovernanceStaking.address, stake_torn.mul(10000000));

            await torn_erc20.mint(relayer1.address, stake_torn.mul(10000000));
            await torn_erc20.mint(relayer2.address,  stake_torn.mul(10000000));
            await torn_erc20.mint(relayer3.address, stake_torn.mul(10000000));

            await torn_erc20.mint(stake1.address, stake_torn.mul(10000000));
            await torn_erc20.mint(stake2.address,  stake_torn.mul(10000000));

            await mRelayerRegistry.connect(relayer1).register(relayer1.address, 0);
            await mRelayerRegistry.connect(relayer1).register(relayer2.address, 0);
            await mRelayerRegistry.connect(relayer1).register(relayer3.address, 0);


            await mRootDb.connect(users.owner).addRelayer(relayer2.address,0);
            await mRootDb.connect(users.owner).addRelayer(relayer3.address,1);
            await mRootDb.connect(users.owner).addRelayer(relayer1.address,2);

            await torn_erc20.connect(stake1).approve(mDeposit.address, stake_torn.mul(10000000));
            await torn_erc20.connect(stake2).approve(mDeposit.address, stake_torn.mul(10000000));

            await mDeposit.connect(operator).setPara(1,stake_torn.mul(10000000));

            await mDeposit.connect(stake1).depositWithApproval(stake_torn.mul(2));
            await mDeposit.connect(stake2).depositWithApproval(stake_torn.mul(2));

            await mDeposit.connect(operator).stake2Node(0,stake_torn);
            await mDeposit.connect(operator).stake2Node(1,stake_torn);
            await mDeposit.connect(operator).stake2Node(2,stake_torn);
            await mDeposit.connect(operator).setPara(1,0);

            await mDeposit.connect(stake2).depositWithApproval(stake_torn);

            expect(await mDeposit.balanceOfStakingOnGov()).equal(stake_torn.mul(2));
            expect(await mRootDb.totalRelayerTorn()).equal(stake_torn.mul(3));
            expect(await mDeposit.checkRewardOnGov()).equal(0);
            expect(await mRootDb.MAX_RELAYER_COUNTER()).equal(3);

            let eth = ethers.utils.parseUnits("1000", 18);
            let counter = 20
            let ret = await TornUserSimulate(fix_info,"eth",eth,BigNumber.from(counter),true);

            expect(about(ret.gov_rev_torn,(await  mDeposit.checkRewardOnGov()))).true;
            expect(about((await mRootDb.totalTorn()).sub(stake_torn.mul(5)),ret.relayer_rev_torn)).true;
            let token1 = await mRootDb.balanceOf(stake1.address);
            let token2 = await mRootDb.balanceOf(stake2.address);
            let all_profit = (await mProfitRecord.getProfit(stake1.address,token1)).add(await mProfitRecord.getProfit(stake2.address,token2));
            expect(about(all_profit,ret.relayer_rev_torn)).true;



            let usdc = ethers.utils.parseUnits("1000", 18);
            let ret2 = await TornUserSimulate(fix_info,"dai",usdc,BigNumber.from(counter),true);

            expect(about(ret.gov_rev_torn.add(ret2.gov_rev_torn),(await  mDeposit.checkRewardOnGov()))).true;
            expect(about((await mRootDb.totalTorn()).sub(stake_torn.mul(5)),ret.relayer_rev_torn.add(ret2.relayer_rev_torn))).true;

            all_profit = (await mProfitRecord.getProfit(stake1.address,token1)).add(await mProfitRecord.getProfit(stake2.address,token2));
            expect(about(all_profit,ret.relayer_rev_torn.add(ret2.relayer_rev_torn))).true;


        });

    })
});
