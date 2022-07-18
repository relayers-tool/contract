import {expect} from "chai";
import {ethers} from "hardhat";
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
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {about} from "./utils";
import {BigNumber} from "ethers";
import {get_user_fixture, set_up_fixture} from "./start_up";

describe("ExitQueue", function () {
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


    let mTornadoGovernanceStaking: MTornadoGovernanceStaking;
    let mTornadoStakingRewards: MTornadoStakingRewards;
    let stake_torn: BigNumber;
    beforeEach(async () => {
        let fix_info = await set_up_fixture("register_relayers");
        let users = await get_user_fixture();
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

        let usdc = ethers.utils.parseUnits("1", 6);
        await usdc_erc20.connect(user1).mint(user1.address, usdc.mul(1000));


        // deposit usdc for test
        usdc = ethers.utils.parseUnits("1", 6);
        await usdc_erc20.connect(user1).approve(mTornRouter.address, usdc);
        await mTornRouter.connect(user1).deposit("usdc", usdc);
        await mTornRouter.connect(user1).withdraw("usdc", usdc, user2.address);

        //deposit eth for test
        let eth = ethers.utils.parseUnits("1000", 18);
        await mTornRouter.connect(user1).deposit("eth", eth, {value: eth});
        await mTornRouter.connect(user1).withdraw("eth", eth, user2.address);


        stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
        await torn_erc20.mint(user1.address, stake_torn.mul(100));
        await torn_erc20.mint(user2.address, stake_torn.mul(100));
        await torn_erc20.mint(user3.address, stake_torn.mul(100));
        await torn_erc20.connect(user1).approve(mDeposit.address, stake_torn.mul(100))
        await torn_erc20.connect(user2).approve(mDeposit.address, stake_torn.mul(100))
        await torn_erc20.connect(user3).approve(mDeposit.address, stake_torn.mul(100))
        await mDeposit.connect(user1).depositWithApproval(stake_torn);
        await mDeposit.connect(user2).depositWithApproval(stake_torn);
        await mDeposit.connect(user3).depositWithApproval(stake_torn);


    });

    describe("addQueueWithApproval(uint256 _amount_token)", function () {

        it("case1 :  test Insufficient", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await expect(mExitQueue.connect(user1).addQueue(token.add(1))).to.revertedWith("ERC20: transfer amount exceeds balance");
            await mExitQueue.connect(user1).addQueue(token);
        });

        it("case2 : add normally and check reslut", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token);
            expect(await mRootDb.balanceOfTorn(mExitQueue.address)).equal(stake_torn);
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(token);
        });


        it("case : add the second time  when not prepared ", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mRootDb.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(token.div(2));
            await expect(mExitQueue.connect(user1).addQueue(token.div(2))).revertedWith("have pending");
        });

        it("case : add 0", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await expect(mExitQueue.connect(user1).addQueue(0)).revertedWith("error para");
        });

        it("case : add the second time  when prepared ", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mRootDb.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(token.div(2));
            expect(await mExitQueue.nextValue()).equal(stake_torn.div(2));
            await mDeposit.connect(user1).depositWithApproval(500000000);
            //triger the executeQueue
            await mDeposit.connect(user1).depositWithApproval(500000000);
            expect(await mExitQueue.nextValue()).equal(0);
            await expect(mExitQueue.connect(user1).addQueue(token.div(2))).revertedWith("have pending");
        });


    });


    describe("test claim()", function () {

        it("case1 :  test not prepared", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mRootDb.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(token.div(2));
            await expect(mExitQueue.connect(user1).claim()).revertedWith("not prepared");
        });

        it("case2 : test when prepared", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mRootDb.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(token.div(2));
            expect(await mExitQueue.nextValue()).equal(stake_torn.div(2));
            await mDeposit.connect(user1).depositWithApproval(500000000);
            //triger the executeQueue
            await mDeposit.connect(user1).depositWithApproval(500000000);
            expect(await mExitQueue.nextValue()).equal(0);
            let last_token = await torn_erc20.balanceOf(user1.address);
            await mExitQueue.connect(user1).claim();
            expect(about(last_token.sub(await torn_erc20.balanceOf(user1.address)).abs(), stake_torn.div(2))).true;
        });

    });

    describe(" cancelQueue()", function () {

        it("case1,2 :  test not prepared coins", async function () {

            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mRootDb.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootDb.balanceOf(mExitQueue.address)).equal(token.div(2));
            let torn_value = await mRootDb.valueForTorn(token.div(2));
            expect(await mExitQueue.nextValue()).equal(torn_value);
            expect(await mExitQueue.maxIndex()).equal(1);
            expect(await mExitQueue.preparedIndex()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(1);
            await expect(mExitQueue.connect(user1).cancelQueue()).emit(mExitQueue, "CancelQueue").withArgs(user1.address, token.div(2));

            expect(await mExitQueue.nextValue()).equal(0);
            expect(await mExitQueue.maxIndex()).equal(1);
            expect(await mExitQueue.preparedIndex()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(1);
            await mExitQueue.connect(user1).addQueue(token.div(4));
            torn_value = await mRootDb.valueForTorn(token.div(4));

            let ret = await mExitQueue.connect(user1).getQueueInfo(user1.address);
            expect(ret.v).equal(token.div(4));
            expect(ret.prepared).equal(false);
            expect(await mExitQueue.nextValue()).equal(torn_value);
            expect(await mExitQueue.maxIndex()).equal(2);
            expect(await mExitQueue.preparedIndex()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(2);

        });

        it("case3 :  test not multiple cancel ", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            await expect(mExitQueue.connect(user1).cancelQueue()).emit(mExitQueue, "CancelQueue").withArgs(user1.address, token.div(2));
            expect(mExitQueue.connect(user1).cancelQueue()).revertedWith("empty")

        });

        it("case4 :  test  prepared coins", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mExitQueue.preparedIndex()).equal(0);
            await mDeposit.connect(user2).depositWithApproval(5000000);
            //triger the executeQueue
            await mDeposit.connect(user2).depositWithApproval(50000000);
            let ret = await mExitQueue.connect(user1).getQueueInfo(user1.address);
            expect(about(ret.v, stake_torn.div(2))).true;
            expect(ret.prepared).equal(true);
            expect(await mExitQueue.preparedIndex()).equal(1);
            expect(mExitQueue.connect(user1).cancelQueue()).revertedWith("prepared")

        });


    });


    describe("executeQueue", function () {

        it("case1-1 :  test cancel counter in MAX_QUEUE_CANCEL and executeQueue", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(5000));
            let max_queue = await mExitQueue.MAX_QUEUE_CANCEL();
            let conter_random = BigInt(Math.floor(Math.random() * 100)) % max_queue.toBigInt();
            if (conter_random >= max_queue.toBigInt()) {
                conter_random = max_queue.sub(1).toBigInt();
            }
            for (let i = 0; i < conter_random; i++) {
                await mExitQueue.connect(user1).addQueue(token.div(2));
                await mExitQueue.connect(user1).cancelQueue();
            }
            expect(await mExitQueue.maxIndex()).equal(conter_random);
            expect(await mExitQueue.nextValue()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(BigNumber.from(conter_random));

            await mExitQueue.connect(user1).addQueue(token.div(2));
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
            await mDeposit.connect(user1).depositWithApproval(5000);
            expect(await mExitQueue.maxIndex()).equal(BigNumber.from(conter_random).add(1));
            expect(await mExitQueue.nextValue()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(0);

        });
        it("case1-2 ,1-3 :  test cancel counter out of MAX_QUEUE_CANCEL and call UpdateSkipIndex before executeQueue", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(5000));
            let max_queue = await mExitQueue.MAX_QUEUE_CANCEL();
            let conter_random = BigInt(Math.floor(Math.random() * 100)) % max_queue.toBigInt();
            for (let i = 0; i < conter_random; i++) {
                await mExitQueue.connect(user1).addQueue(token.div(2));
                await mExitQueue.connect(user1).cancelQueue();
            }
            for (let i = 0; i < 100; i++) {
                await mExitQueue.connect(user1).addQueue(token.div(2));
                await mExitQueue.connect(user1).cancelQueue();
            }
            expect(await mExitQueue.maxIndex()).equal(BigNumber.from(conter_random).add(100));
            await mExitQueue.connect(user1).addQueue(token.div(2));
            expect(await mExitQueue.preparedIndex()).equal(0);
            await mExitQueue.connect(user2).UpdateSkipIndex();
            await expect(mExitQueue.connect(user2).UpdateSkipIndex()).revertedWith("skip is too short");
            expect(await mExitQueue.preparedIndex()).equal(99);

            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
            await mDeposit.connect(user1).depositWithApproval(5000);
            expect(await mExitQueue.maxIndex()).equal(BigNumber.from(conter_random).add(101));
            expect(await mExitQueue.nextValue()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(0);

        });

    });
    describe("multi executeQueue()  nextValue() UpdateSkipIndex()", function () {
        it("case1:", async function () {
            let token1 = await mRootDb.balanceOf(user1.address);
            stake_torn = ethers.utils.parseUnits(Math.random() * 100 + "", 18);
            await torn_erc20.connect(user1).mint(user1.address, stake_torn.mul(5000));

            let max_queue = await mExitQueue.MAX_QUEUE_CANCEL();
            await expect(mExitQueue.connect(user2).executeQueue()).revertedWith("no pending");

            for (let i = 0; i < max_queue.add(5).toNumber(); i++) {
                await mExitQueue.connect(user1).addQueue(token1.div(2));
                await mExitQueue.connect(user1).cancelQueue();
            }

            await torn_erc20.connect(user2).mint(user2.address, stake_torn.mul(5000));

            let token2 = await mRootDb.balanceOf(user2.address);
            for (let i = 0; i < max_queue.add(10).toNumber(); i++) {
                await mExitQueue.connect(user2).addQueue(token2.div(2));
                await mExitQueue.connect(user2).cancelQueue();
            }
            expect(await mExitQueue.nextSkipIndex()).equal(await mExitQueue.INDEX_ERR());
            await expect(mExitQueue.connect(user2).nextValue()).revertedWith("too many skips");
            await expect(mExitQueue.connect(user2).executeQueue()).revertedWith("too many skips");


        });
    });


    describe("multi addQueue and cancel", function () {

        it("case1 :  multi addQueue and cancel and  the  cancel counter in MAX_QUEUE_CANCEL ", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            await mExitQueue.connect(user2).addQueue(token.div(2));
            await mExitQueue.connect(user3).addQueue(token.div(2));


            expect(stake_torn.div(2)).equal(await mRootDb.valueForTorn(token.div(2)));
            expect(await mExitQueue.nextValue()).equal(await mRootDb.valueForTorn(token.div(2)));

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            await mExitQueue.connect(user2).cancelQueue();
            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(50000);

            //  trigger executeQueue
            let last_toltal = await mRootDb.totalTorn();

            await mDeposit.connect(user1).depositWithApproval(50000);

            expect(about(await mRootDb.totalTorn(), last_toltal.sub(stake_torn.div(2)).add(50000))).true;

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(1);
            expect(await mExitQueue.nextValue()).equal(await mRootDb.valueForTorn(token.div(2)));

            expect(about(await mExitQueue.nextValue(), stake_torn.div(2))).equal(true);
            let torn_last = await torn_erc20.connect(user1).balanceOf(user1.address);
            expect(await mExitQueue.connect(user1).claim());
            expect(about(await torn_erc20.connect(user1).balanceOf(user1.address), torn_last.add(stake_torn.div(2)))).equal(true);
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
            await mDeposit.connect(user1).depositWithApproval(5000);

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(3);
            expect(await mExitQueue.nextValue()).equal(0);


            await expect(mExitQueue.connect(user1).claim()).revertedWith("have no pending");
            torn_last = await torn_erc20.connect(user3).balanceOf(user3.address);
            await mExitQueue.connect(user3).claim();
            expect(about(await torn_erc20.connect(user3).balanceOf(user3.address), torn_last.add(stake_torn.div(2)))).true;

        });


        it("case2 :  multi addQueue and cancel and  the  cancel counter out of MAX_QUEUE_CANCEL ", async function () {
            let token = await mRootDb.balanceOf(user1.address);
            await mExitQueue.connect(user1).addQueue(token.div(2));
            await mExitQueue.connect(user2).addQueue(token.div(2));
            await mExitQueue.connect(user3).addQueue(token.div(2));


            expect(stake_torn.div(2)).equal(await mRootDb.valueForTorn(token.div(2)));
            expect(await mExitQueue.nextValue()).equal(await mRootDb.valueForTorn(token.div(2)));

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            await mExitQueue.connect(user2).cancelQueue();
            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            await expect(mExitQueue.connect(user2).cancelQueue()).revertedWith("empty");

            for (let i = 1; i < 200; i++) {
                await mExitQueue.connect(user2).addQueue(token.div(2));
                await mExitQueue.connect(user2).cancelQueue();
                expect(await mExitQueue.maxIndex()).equal(3 + i);
                expect(await mExitQueue.preparedIndex()).equal(0);
            }
            // add a draw at the end of queue
            await mExitQueue.connect(user2).addQueue(token.div(2));


            await expect(mExitQueue.connect(user1).UpdateSkipIndex()).revertedWith("skip is too short");
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(50000);
            await expect(mExitQueue.connect(user1).UpdateSkipIndex()).revertedWith("skip is too short");
            //  trigger executeQueue
            let last_toltal = await mRootDb.totalTorn();

            await mDeposit.connect(user1).depositWithApproval(50000);


            await mDeposit.connect(user1).depositWithApproval(50000);
            await mDeposit.connect(user1).depositWithApproval(50000);
            await mExitQueue.connect(user1).UpdateSkipIndex();
            await mExitQueue.connect(user1).UpdateSkipIndex();

            await expect(mExitQueue.connect(user1).UpdateSkipIndex()).revertedWith("skip is too short");


            await mDeposit.connect(user1).depositWithApproval(50000);
            await mDeposit.connect(user1).depositWithApproval(50000);

            expect(await mExitQueue.preparedIndex()).equal(await mExitQueue.maxIndex());


            let torn_last = await torn_erc20.connect(user1).balanceOf(user1.address);
            expect(await mExitQueue.connect(user1).claim());
            expect(about(await torn_erc20.connect(user1).balanceOf(user1.address), torn_last.add(stake_torn.div(2)))).equal(true);
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
            await mDeposit.connect(user1).depositWithApproval(5000);

            await expect(mExitQueue.connect(user1).claim()).revertedWith("have no pending");
            torn_last = await torn_erc20.connect(user3).balanceOf(user3.address);
            await mExitQueue.connect(user3).claim();
            expect(about(await torn_erc20.connect(user3).balanceOf(user3.address), torn_last.add(stake_torn.div(2)))).true;

            torn_last = await torn_erc20.connect(user2).balanceOf(user2.address);
            await mExitQueue.connect(user2).claim();
            expect(about(await torn_erc20.connect(user2).balanceOf(user2.address), torn_last.add(stake_torn.div(2)))).true;


        });


    });

});
