import {expect} from "chai";
import {ethers} from "hardhat";

import {about} from "./utils";
import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    RootDB
} from "../typechain-types";

import {BigNumber} from "@ethersproject/bignumber";
import {signERC2612Permit} from "eth-permit";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture, USER_FIX} from "./start_up";

describe("test_deposit", function () {
    let usdc_erc20: MERC20, torn_erc20: MERC20;

    let mExitQueue: ExitQueue;
    let mTornRouter: MTornRouter;

    let mDeposit: Deposit;
    let mRootDb: RootDB;
    let mIncome: Income;

    let user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress, operator: SignerWithAddress;
    let stake1: SignerWithAddress;
    let owner: SignerWithAddress;
    let dao_relayer1: SignerWithAddress;
    let reward: SignerWithAddress;
    let users: USER_FIX;

    let mTornadoGovernanceStaking: MTornadoGovernanceStaking;
    let mTornadoStakingRewards: MTornadoStakingRewards;
    beforeEach(async () => {

        let fix_info = await set_up_fixture("register_relayers");
        users = await get_user_fixture();
        usdc_erc20 = fix_info.usdc_erc20;
        torn_erc20 = fix_info.torn_erc20;
        mTornRouter = fix_info.mTornRouter;
        mDeposit = fix_info.mDeposit;
        mIncome = fix_info.mIncome;
        user1 = users.user1;
        user2 = users.user2;
        user3 = users.user3;
        operator = users.operator;
        stake1 = users.stake1;
        mTornadoGovernanceStaking = fix_info.mTornadoGovernanceStaking;
        mRootDb = fix_info.mRootDb;
        mExitQueue = fix_info.mExitQueue;
        mTornadoStakingRewards = fix_info.mTornadoStakingRewards;
        dao_relayer1 = users.dao_relayer1;
        owner = users.owner;
        reward = users.reward;

        let usdc = ethers.utils.parseUnits("1", 6);
        await usdc_erc20.connect(user1).mint(user1.address, usdc.mul(1000));


        usdc = ethers.utils.parseUnits("1", 6);
        await usdc_erc20.connect(user1).approve(mTornRouter.address, usdc);

        await mTornRouter.connect(user1).deposit("usdc", usdc);

        await mTornRouter.connect(user1).withdraw("usdc", usdc, user2.address);


        //deposit eth for test
        let eth = ethers.utils.parseUnits("1000", 18);
        await mTornRouter.connect(user1).deposit("eth", eth, {value: eth});

        await mTornRouter.connect(user1).withdraw("eth", eth, user2.address);


    });

    describe("test setPara", function () {
        let stake_torn = ethers.utils.parseUnits("50", 18);

        beforeEach(async () => {

            await torn_erc20.connect(user1).mint(user1.address, stake_torn);
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn);
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
        });

        it("case1 : test operator", async function () {

            let maxReserveTorn = ethers.utils.parseUnits(Math.random() * 10 + "", 18);
            let maxRewardInGov = ethers.utils.parseUnits(Math.random() * 10 + "", 18);

            await expect(mDeposit.connect(user1).setPara(1, maxReserveTorn)).to.be.revertedWith("Caller is not operator");

        });

        it("case2 : test result", async function () {
            let maxReserveTorn = ethers.utils.parseUnits(Math.random() * 10 + "", 18);
            let maxRewardInGov = ethers.utils.parseUnits(Math.random() * 10 + "", 18);
            await mDeposit.connect(operator).setPara(1, maxReserveTorn);
            await mDeposit.connect(operator).setPara(2, maxRewardInGov);
            await mDeposit.connect(operator).setPara(3, users.reward.address);
            await mDeposit.connect(operator).setPara(4, 1);
            expect(await mDeposit.rewardAddress()).to.be.equal(users.reward.address);
            expect(await mDeposit.maxReserveTorn()).to.be.equal(maxReserveTorn);
            expect(await mDeposit.maxRewardInGov()).to.be.equal(maxRewardInGov);
            expect(await mDeposit.profitRatio()).to.be.equal(1);
        });
        it("case3 : Invalid para", async function () {
            let maxReserveTorn = ethers.utils.parseUnits(Math.random() * 10 + "", 18);
            let maxRewardInGov = ethers.utils.parseUnits(Math.random() * 10 + "", 18);
            await expect(mDeposit.connect(operator).setPara(0, maxReserveTorn,)).revertedWith("Invalid _index");
            await expect(mDeposit.connect(operator).setPara(1, 0));
            await expect(mDeposit.connect(operator).setPara(2, 0));
            await expect(mDeposit.connect(operator).setPara(3, 0));
        });


    });

    describe("test deposit(uint256 _amount,uint256 deadline, uint8 v, bytes32 r, bytes32 s)", function () {

        it("case1 :  test deposit", async function () {
            let stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn);
            const allowanceParameters = await signERC2612Permit(user1, torn_erc20.address, user1.address, mDeposit.address, stake_torn.toBigInt().toString()); //Sign operation
            expect(await mRootDb.balanceOf(mDeposit.address)).equal(0);
            await mDeposit.connect(user1).deposit(stake_torn, allowanceParameters.deadline, allowanceParameters.v, allowanceParameters.r, allowanceParameters.s);
            expect(await mRootDb.totalTorn()).equal(stake_torn);
            await expect(mDeposit.connect(user1).deposit(stake_torn.div(2), allowanceParameters.deadline, allowanceParameters.v, allowanceParameters.r, allowanceParameters.s))
                .revertedWith("ERC20Permit: invalid signature");
        });

    });


    describe("stake2Node", function () {

        it("stake2Node test operator", async function () {
            let stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await expect(mDeposit.connect(user1).stake2Node(0, 5000)).revertedWith("Caller is not operator");
            await mDeposit.connect(operator).setPara(2, stake_torn.mul(5));
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(5));

            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn);
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            await mDeposit.connect(operator).stake2Node(0, stake_torn.div(2));
            await expect(mDeposit.connect(operator).stake2Node(10, stake_torn.div(2))).revertedWith("Invalid index");
        });

    });
    describe("onlyExitQueue", function () {

        it("test onlyExitQueue ", async function () {
            let stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await expect(mDeposit.connect(user1).stake2Node(0, 5000)).revertedWith("Caller is not operator");
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(5));
            await mDeposit.connect(operator).setPara(2, stake_torn.mul(5));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn);
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            await expect(mDeposit.connect(user1).withdraw_for_exit(user3.address, await mRootDb.balanceOf(user1.address))).revertedWith("Caller is not exitQueue");
        });

    });


    describe("test isBalanceEnough", function () {

        it("test isBalanceEnough", async function () {
            let stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await expect(mDeposit.connect(user1).stake2Node(0, 5000)).revertedWith("Caller is not operator");
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(5));
            await mDeposit.connect(operator).setPara(2, stake_torn.mul(5));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(500));
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            expect(await mDeposit.isBalanceEnough(500)).true;
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token);
            expect(await mDeposit.isBalanceEnough(500)).false;
        });

    });

    describe("test multi sufficient", function () {
        let stake_torn: BigNumber;
        beforeEach(async () => {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(5));
            await mDeposit.connect(operator).setPara(2, stake_torn.mul(5));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(5000));
            await torn_erc20.connect(user2).approve(mDeposit.address, stake_torn.mul(5000));
            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(500));
            await torn_erc20.connect(user1).mint(user2.address, stake_torn.mul(500));
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            await mDeposit.connect(operator).stake2Node(0, stake_torn);
        });


        it("test insufficient to whitDraw", async function () {
            await expect(mDeposit.connect(user1).withDraw(await mRootDb.balanceOf(user1.address))).revertedWith("pool Insufficient");
        });

        it("test not stake2Node operator ", async function () {
            await expect(mDeposit.connect(user1).stake2Node(0, 5000)).revertedWith("Caller is not operator");
        });


        it("test need_unlock form gov", async function () {
            let laset_token = await mRootDb.balanceOf(user1.address);
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(6));
            expect(await torn_erc20.balanceOf(mDeposit.address)).equal(0);
            let new_token = await mRootDb.balanceOf(user1.address);
            expect(await mDeposit.isBalanceEnough(new_token.sub(laset_token))).true;
            let last_torn = await torn_erc20.balanceOf(user1.address);
            await mDeposit.connect(user1).withDraw(new_token.sub(laset_token));
            let new_torn = await torn_erc20.balanceOf(user1.address);
            expect(about(new_torn.sub(last_torn), stake_torn.mul(6))).true;
        });

        it("test need_unlock form gov when deposit", async function () {
            let laset_token = await mRootDb.balanceOf(user1.address);
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(6));
            expect(await torn_erc20.balanceOf(mDeposit.address)).equal(0);
            let new_token = await mRootDb.balanceOf(user1.address);

            expect(await mDeposit.isBalanceEnough(new_token.sub(laset_token))).true;

            await mExitQueue.connect(user1).addQueue(new_token.sub(laset_token));
            //unlock the torn form gov
            await mDeposit.connect(user2).depositWithApproval(501);
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(new_token.sub(laset_token));
            //transfer to queue
            await mDeposit.connect(user2).depositWithApproval(500);
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(0);
            let last_torn = await torn_erc20.balanceOf(user1.address);
            await mExitQueue.connect(user1).claim();
            let new_torn = await torn_erc20.balanceOf(user1.address);
            expect(about(new_torn.sub(last_torn), stake_torn.mul(6))).true;
        });

        it("test need_unlock form gov IN_SUFFICIENT  when deposit", async function () {
            let laset_token = await mRootDb.balanceOf(user1.address);
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(2));
            let mDeposit_tron = await torn_erc20.balanceOf(mDeposit.address);
            await mDeposit.connect(operator).stake2Node(0, mDeposit_tron);

            await mExitQueue.connect(user1).addQueue(laset_token);
            await mDeposit.connect(user2).depositWithApproval(500);
            expect(await mDeposit.getValueShouldUnlockFromGov()).equal(await mDeposit.IN_SUFFICIENT());

        });


        it("test need_unlock form gov  when deposit balance is over queue", async function () {
            let laset_token = await mRootDb.balanceOf(user1.address);
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(2));
            let new_token = await mRootDb.balanceOf(user1.address);


            await mExitQueue.connect(user1).addQueue(new_token.sub(laset_token).div(5));
            expect(await mDeposit.getValueShouldUnlockFromGov()).lt(await mDeposit.IN_SUFFICIENT());
            //transfer to queue
            await mDeposit.connect(user2).depositWithApproval(500);
            expect(await mExitQueue.nextValue()).equal(0);
            expect(about(await torn_erc20.balanceOf(mExitQueue.address), stake_torn.mul(2).div(5))).equal(true);

        });

        it("test balance Insufficient and 0 root token", async function () {
            let laset_token = await mRootDb.balanceOf(user1.address);

            //transfer to queue
            await torn_erc20.mint(user1.address, laset_token.mul(100000));
            await torn_erc20.approve(mDeposit.address, laset_token.mul(100000))
            // await expect(mDeposit.connect(user1).withDrawWithApproval(laset_token.mul(2))).revertedWith("balance Insufficient");
            await expect(mDeposit.connect(user1).withDraw(0)).revertedWith("error para");


        });


    });


    describe("test depositWithApproval", function () {
        let stake_torn: BigNumber = BigNumber.from(0);

        it("case1 : test Insufficient", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.connect(user3).mint(user3.address, stake_torn);
            await torn_erc20.connect(user3).approve(mDeposit.address, stake_torn);
            await expect(mDeposit.connect(user3).depositWithApproval(stake_torn.mul(100))).to.be.revertedWith("ERC20: insufficient allowance");
        });

        it("case:2-1 : test succeed ", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            expect(await mRootDb.totalRelayerTorn()).to.be.equal(0);
            await torn_erc20.connect(user3).mint(user3.address, stake_torn);
            await torn_erc20.connect(user3).approve(mDeposit.address, stake_torn);
            await mDeposit.connect(user3).depositWithApproval(stake_torn);
            expect(await mRootDb.totalTorn()).to.be.equal(stake_torn);


            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(3));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(3));
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(3));
            expect(await mRootDb.totalTorn()).to.be.equal(stake_torn.mul(4));
            expect((await mRootDb.balanceOf(user1.address)).div(await mRootDb.balanceOf(user3.address))).to.be.equal(3);
        });

        it("case:2-2 : reward is correct ", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            expect(await mRootDb.totalRelayerTorn()).to.be.equal(0);
            await torn_erc20.connect(user3).mint(user3.address, stake_torn);
            await torn_erc20.connect(user3).approve(mDeposit.address, stake_torn);
            await mDeposit.connect(user3).depositWithApproval(stake_torn);

            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(3));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(3));
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(3));

            //add reward to mIncome
            await torn_erc20.connect(user3).mint(mIncome.address, stake_torn);
            expect(await mRootDb.totalTorn()).to.be.equal(stake_torn.mul(5));
            await mIncome.connect(operator).distributeTorn(stake_torn);
            expect(await mRootDb.totalTorn()).to.be.equal(stake_torn.mul(5));
            expect((await mRootDb.balanceOfTorn(user1.address)).div(await mRootDb.balanceOfTorn(user3.address)))
                .to.be.equal(3)
        });

        it("case 2-3.isNeedClaimFromGov", async function () {

            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.connect(user3).mint(user3.address, stake_torn.mul(2));
            await torn_erc20.connect(user3).approve(mDeposit.address, stake_torn.mul(2));
            let staking_to_gov_1 = await mTornadoGovernanceStaking.lockedBalance(mDeposit.address);
            expect(staking_to_gov_1).to.be.equal(0);
            await mDeposit.connect(operator).setPara(1, 500);
            await mDeposit.connect(operator).setPara(2, 500);
            await mDeposit.connect(user3).depositWithApproval(stake_torn);
            expect(await mTornadoGovernanceStaking.lockedBalance(mDeposit.address)).to.be.equal(stake_torn);
            expect(await mDeposit.maxReserveTorn()).to.be.gt(await torn_erc20.balanceOf(mDeposit.address))

            expect(await mTornadoStakingRewards.checkReward(mDeposit.address)).to.equal(0);
            //deposit eth for test
            let eth = ethers.utils.parseUnits("1000", 18);
            let counter = 20

            for (let i = 0; i < counter; i++) {
                await mTornRouter.connect(user1).deposit("eth", eth, {value: eth});
                await mTornRouter.connect(user1).withdraw("eth", eth, user2.address);
            }
            let reward = await mTornadoStakingRewards.checkReward(mDeposit.address);
            expect(reward).gt(500);
            //deposit to tirger the ClaimFromGov
            await mDeposit.connect(user3).depositWithApproval(stake_torn.div(50));
            expect(await mTornadoStakingRewards.checkReward(mDeposit.address)).to.equal(0);


        });


        it("case 2-4. isNeedTransfer2Queue \n  case 2-5.UnlockFromGov \n 2-6._checkLock2Gov", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            expect(await mRootDb.totalRelayerTorn()).to.be.equal(0);
            await torn_erc20.connect(user3).mint(user3.address, stake_torn.mul(50));
            await torn_erc20.connect(user3).approve(mDeposit.address, stake_torn.mul(10));
            await mDeposit.connect(operator).setPara(1, stake_torn.div(10));
            await mDeposit.connect(operator).setPara(2, stake_torn);
            //_checkLock2Gov
            await expect(mDeposit.connect(user3).depositWithApproval(stake_torn)).to.be.emit(mDeposit, "lock_to_gov")
                .withArgs(stake_torn);
            expect(await mRootDb.totalTorn()).to.be.equal(stake_torn);

            expect(await torn_erc20.balanceOf(mDeposit.address)).to.be.equal(0);
            let token = await mRootDb.balanceOf(user3.address);
            await expect(mExitQueue.connect(user3).addQueue(token)).to
                .be.emit(mExitQueue, "add_queue").withArgs(user3.address, token);
            expect(await mExitQueue.nextValue()).to.be.equal(stake_torn);
            let shortage = await mDeposit.getValueShouldUnlockFromGov();
            expect(shortage).gt(0);
            await mDeposit.connect(user3).depositWithApproval(2000000);
            await mDeposit.connect(user3).depositWithApproval(2000000);
            let next_value = await mExitQueue.nextValue();
            expect(next_value).equal(0);

            expect(about(await torn_erc20.balanceOf(mExitQueue.address), stake_torn)).to.true;

        });

        it("case5 : depositWithApproval 0", async function () {
            await expect(mDeposit.connect(user3).depositWithApproval(0)).to.be.revertedWith("error para");
        });

    });


    describe("test withdraw", function () {
        let stake_torn = ethers.utils.parseUnits("50", 18);


        it("case1 : : test Insufficient", async function () {

            await expect(mDeposit.connect(user1).withDraw(stake_torn)).to.be.revertedWith("err root token")
            await expect(mDeposit.connect(user1).withDraw(0)).to.be.revertedWith("panic code 0x12")
        });

        it("case2 : : Queue is not empty or pool Insufficient", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(10));
            await mDeposit.connect(operator).setPara(2, 500);
            await torn_erc20.mint(user1.address, stake_torn.mul(100));
            await torn_erc20.mint(user2.address, stake_torn.mul(100));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(10))
            await torn_erc20.connect(user2).approve(mDeposit.address, stake_torn.mul(10))
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            await mDeposit.connect(user2).depositWithApproval(stake_torn);
            expect(await torn_erc20.balanceOf(mDeposit.address)).to.equal(stake_torn.mul(2));
            expect(await mRootDb.totalTorn()).equal(stake_torn.mul(2));

            await mDeposit.connect(operator).stake2Node(0, stake_torn.mul(3).div(2));
            let token = await mRootDb.balanceOf(user1.address);

            expect((await mDeposit.getValueShouldUnlock(token)).torn).equal(stake_torn);
            await expect(mDeposit.connect(user1).withDraw(token)).to.revertedWith("pool Insufficient");

            await mExitQueue.connect(user1).addQueue(token);

            expect((await mDeposit.getValueShouldUnlock(token)).torn).equal(stake_torn);
            await expect(mDeposit.connect(user1).withDraw(token)).to.revertedWith("Queue not empty");
        });

        it("case3  : use gov staking for withdraw", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.mint(user1.address, stake_torn.mul(100));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(10))
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            expect(await mRootDb.totalTorn()).equal(stake_torn);
            let token = await mRootDb.balanceOf(user1.address);
            expect(await mTornadoGovernanceStaking.lockedBalance(mDeposit.address)).equal(stake_torn);
            expect((await mDeposit.getValueShouldUnlock(token)).torn).equal(stake_torn);
            await mDeposit.connect(user1).withDraw(token);
            expect(await mTornadoGovernanceStaking.lockedBalance(mDeposit.address)).equal(0);

        });


        it("case4  : withdraw by Deposit balance", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            stake_torn = stake_torn.mul(2);
            await torn_erc20.mint(user1.address, stake_torn.mul(100));
            await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(10))
            await mDeposit.connect(operator).setPara(1, stake_torn.mul(10));
            await mDeposit.connect(operator).setPara(2, 500);
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            expect(await mRootDb.totalTorn()).equal(stake_torn);
            let token = await mRootDb.balanceOf(user1.address);
            await mDeposit.connect(user1).withDraw(token.div(2));
            expect(await mRootDb.totalTorn()).equal(stake_torn.div(2));

        });


    });


});
