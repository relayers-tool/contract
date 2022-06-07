import { expect } from "chai";
import { ethers } from "hardhat";
import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    RootManger
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";
import {about, createFixture, Fixture} from "./utils";
import {BigNumber} from "ethers";
import {signERC2612Permit} from "eth-permit";

describe("ExitQueue", function () {
    let usdc_erc20: MERC20,torn_erc20: MERC20;

    let mExitQueue :ExitQueue;
    let mTornRouter :MTornRouter;

    let mDeposit :Deposit;
    let mRootManger :RootManger;
    let mIncome :Income;

    let user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress;
    let owner:SignerWithAddress;
    let dao_relayer1:SignerWithAddress;

    let fix_info: Fixture;

    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    let mTornadoStakingRewards:MTornadoStakingRewards;
    let stake_torn:BigNumber;
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
        mTornadoGovernanceStaking = fix_info.mTornadoGovernanceStaking;
        mRootManger = fix_info.mRootManger;
        mExitQueue = fix_info.mExitQueue;
        mTornadoStakingRewards = fix_info.mTornadoStakingRewards;
        dao_relayer1 = fix_info.dao_relayer1;
        owner = fix_info.owner;

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



        stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
        await torn_erc20.mint(user1.address,stake_torn.mul(100));
        await torn_erc20.mint(user2.address,stake_torn.mul(100));
        await torn_erc20.mint(user3.address,stake_torn.mul(100));
        await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn.mul(100))
        await torn_erc20.connect(user2).approve(mDeposit.address,stake_torn.mul(100))
        await torn_erc20.connect(user3).approve(mDeposit.address,stake_torn.mul(100))
        await mDeposit.connect(user1).depositWithApproval(stake_torn);
        await mDeposit.connect(user2).depositWithApproval(stake_torn);
        await mDeposit.connect(user3).depositWithApproval(stake_torn);


    });

    describe("addQueueWithApproval(uint256 _amount_token)", function () {

        it("case1 :  test Insufficient", async function () {
             let token = await mRootManger.balanceOf(user1.address);
             await mRootManger.connect(user1).approve(mExitQueue.address,token);
             await expect(mExitQueue.connect(user1).addQueueWithApproval(token.add(1))).to.revertedWith("ERC20: insufficient allowance");
             await mExitQueue.connect(user1).addQueueWithApproval(token);
        });

        it("case2 : add normally and check reslut", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token);
            expect(await mRootManger.balanceOfTorn(mExitQueue.address)).equal(stake_torn);
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token);
        });


        it("case : add the second time  when not prepared ", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            expect(await mRootManger.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token.div(2));
            await expect(mExitQueue.connect(user1).addQueueWithApproval(token.div(2))).revertedWith("have pending");
        });

        it("case : add the second time  when prepared ", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            expect(await mRootManger.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token.div(2));
            expect(await mExitQueue.nextValue()).equal(stake_torn.div(2));
            await mDeposit.connect(user1).depositWithApproval(500000000);
            //triger the executeQueue
            await mDeposit.connect(user1).depositWithApproval(500000000);
            expect(await mExitQueue.nextValue()).equal(0);
            await expect(mExitQueue.connect(user1).addQueueWithApproval(token.div(2))).revertedWith("have pending");
        });


    });


    describe("withDraw()", function () {

        it("case1 :  test not prepared", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            expect(await mRootManger.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token.div(2));
            await expect(mExitQueue.connect(user1).withDraw()).revertedWith("not prepared");
        });

        it("case2 : test when prepared", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            expect(await mRootManger.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token.div(2));
            expect(await mExitQueue.nextValue()).equal(stake_torn.div(2));
            await mDeposit.connect(user1).depositWithApproval(500000000);
            //triger the executeQueue
            await mDeposit.connect(user1).depositWithApproval(500000000);
            expect(await mExitQueue.nextValue()).equal(0);
            let last_token = await torn_erc20.balanceOf(user1.address);
            await mExitQueue.connect(user1).withDraw();
            expect(about(last_token.sub(await torn_erc20.balanceOf(user1.address)).abs(),stake_torn.div(2))).true;
        });

    });

    describe("addQueue(uint256 _amount_token, uint256 deadline, uint8 v, bytes32 r, bytes32 s)", function () {

        it("case1 :  test addQueue", async function () {
          let token =await mRootManger.balanceOf(user1.address);
           const allowanceParameters = await signERC2612Permit(user1, mRootManger.address,user1.address, mExitQueue.address, token.div(2).toBigInt().toString()); //Sign operation
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(0);
            await mExitQueue.connect(user1).addQueue(token.div(2),allowanceParameters.deadline,allowanceParameters.v,allowanceParameters.r,allowanceParameters.s);
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token.div(2));
            await expect(mExitQueue.connect(user1).withDraw()).revertedWith("not prepared");

            await expect(mExitQueue.connect(user1).addQueue(token.div(3),allowanceParameters.deadline,allowanceParameters.v,allowanceParameters.r,allowanceParameters.s))
            .revertedWith("ERC20Permit: invalid signature");
        });

    });

    describe(" cancelQueue()", function () {

        it("case1,2 :  test not prepared coins", async function () {

            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            expect(await mRootManger.balanceOfTorn(mExitQueue.address)).equal(stake_torn.div(2));
            expect(await mRootManger.balanceOf(mExitQueue.address)).equal(token.div(2));
            let torn_value = await mRootManger.valueForTorn(token.div(2));
            expect(await mExitQueue.nextValue()).equal(torn_value);
            expect(await mExitQueue.maxIndex()).equal(1);
            expect(await mExitQueue.preparedIndex()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(1);
            await expect(mExitQueue.connect(user1).cancelQueue()).emit(mExitQueue,"cancel_queue").withArgs(user1.address,token.div(2));

            expect(await mExitQueue.nextValue()).equal(0);
            expect(await mExitQueue.maxIndex()).equal(1);
            expect(await mExitQueue.preparedIndex()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(1);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(4));
             torn_value = await mRootManger.valueForTorn(token.div(4));
            expect(await mExitQueue.nextValue()).equal(torn_value);
            expect(await mExitQueue.maxIndex()).equal(2);
            expect(await mExitQueue.preparedIndex()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(2);

        });

        it("case3 :  test not multiple cancel ", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            await expect(mExitQueue.connect(user1).cancelQueue()).emit(mExitQueue,"cancel_queue").withArgs(user1.address,token.div(2));
            expect(mExitQueue.connect(user1).cancelQueue()).revertedWith("empty")

        });

        it("case4 :  test  prepared coins", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            expect(await mExitQueue.preparedIndex()).equal(0);
            await mDeposit.connect(user2).depositWithApproval(5000000);
            //triger the executeQueue
            await mDeposit.connect(user1).depositWithApproval(50000000);
            expect(await mExitQueue.preparedIndex()).equal(1);
            expect(mExitQueue.connect(user1).cancelQueue()).revertedWith("prepared")

        });


    });


    describe("executeQueue", function () {

        it("case1-1 :  test cancel counter in MAX_QUEUE_CANCEL and executeQueue", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await torn_erc20.connect(user1).mint(user1.address,stake_torn.mul(5000));
            await mRootManger.connect(user1).approve(mExitQueue.address,token.mul(5000));
             let max_queue = await mExitQueue.MAX_QUEUE_CANCEL();
             let conter_random = BigInt(Math.floor(Math.random()*100)) % max_queue.toBigInt();
             for(let i = 0 ; i < conter_random ;i++){
                 await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
                 await mExitQueue.connect(user1).cancelQueue();
             }
             expect(await mExitQueue.maxIndex()).equal(conter_random);
             expect(await mExitQueue.nextValue()).equal(0);
             expect(await mExitQueue.nextSkipIndex()).equal(BigNumber.from(conter_random));

             await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
             // unlock torn from gov staking
             await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
             await mDeposit.connect(user1).depositWithApproval(5000);
            expect(await mExitQueue.maxIndex()).equal(BigNumber.from(conter_random).add(1));
            expect(await mExitQueue.nextValue()).equal(0);
            expect(await mExitQueue.nextSkipIndex()).equal(0);

        });
        it("case1-2 ,1-3 :  test cancel counter out of MAX_QUEUE_CANCEL and call UpdateSkipIndex before executeQueue", async function () {
            let token = await mRootManger.balanceOf(user1.address);
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await torn_erc20.connect(user1).mint(user1.address,stake_torn.mul(5000));
            await mRootManger.connect(user1).approve(mExitQueue.address,token.mul(5000));
            let max_queue = await mExitQueue.MAX_QUEUE_CANCEL();
            let conter_random = BigInt(Math.floor(Math.random()*100)) % max_queue.toBigInt();
            for(let i = 0 ; i < conter_random ;i++){
                await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
                await mExitQueue.connect(user1).cancelQueue();
            }
            for(let i = 0 ; i < 100 ;i++){
                await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
                await mExitQueue.connect(user1).cancelQueue();
            }
            expect(await mExitQueue.maxIndex()).equal(BigNumber.from(conter_random).add(100));
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
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



    describe("multi addQueue and cancel", function () {

        it("case1 :  multi addQueue and cancel and  the  cancel counter in MAX_QUEUE_CANCEL ", async function () {
            let token =await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token.mul(500))
            await mRootManger.connect(user2).approve(mExitQueue.address,token.mul(500))
            await mRootManger.connect(user3).approve(mExitQueue.address,token.mul(500))
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            await mExitQueue.connect(user2).addQueueWithApproval(token.div(2));
            await mExitQueue.connect(user3).addQueueWithApproval(token.div(2));


            expect(stake_torn.div(2)).equal(await mRootManger.valueForTorn(token.div(2)));
            expect(await mExitQueue.nextValue()).equal(await mRootManger.valueForTorn(token.div(2)));

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            await mExitQueue.connect(user2).cancelQueue();
            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(50000);

            //  trigger executeQueue
            let last_toltal = await mRootManger.totalTorn();

            await mDeposit.connect(user1).depositWithApproval(50000);

            expect(about(await mRootManger.totalTorn(),last_toltal.sub(stake_torn.div(2)).add(50000))).true;

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(1);
            expect(await mExitQueue.nextValue()).equal(await mRootManger.valueForTorn(token.div(2)));

            expect(about(await mExitQueue.nextValue(),stake_torn.div(2))).equal(true);
            let torn_last = await torn_erc20.connect(user1).balanceOf(user1.address);
            expect(await mExitQueue.connect(user1).withDraw());
            expect(about(await torn_erc20.connect(user1).balanceOf(user1.address),torn_last.add(stake_torn.div(2)))).equal(true);
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
            await mDeposit.connect(user1).depositWithApproval(5000);

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(3);
            expect(await mExitQueue.nextValue()).equal(0);


            await expect(mExitQueue.connect(user1).withDraw()).revertedWith("have no pending");
             torn_last = await torn_erc20.connect(user3).balanceOf(user3.address);
            await mExitQueue.connect(user3).withDraw();
            expect(about(await torn_erc20.connect(user3).balanceOf(user3.address),torn_last.add(stake_torn.div(2)))).true;

        });


        it("case2 :  multi addQueue and cancel and  the  cancel counter out of MAX_QUEUE_CANCEL ", async function () {
            let token =await mRootManger.balanceOf(user1.address);
            await mRootManger.connect(user1).approve(mExitQueue.address,token.mul(500))
            await mRootManger.connect(user2).approve(mExitQueue.address,token.mul(500))
            await mRootManger.connect(user3).approve(mExitQueue.address,token.mul(500))
            await mExitQueue.connect(user1).addQueueWithApproval(token.div(2));
            await mExitQueue.connect(user2).addQueueWithApproval(token.div(2));
            await mExitQueue.connect(user3).addQueueWithApproval(token.div(2));


            expect(stake_torn.div(2)).equal(await mRootManger.valueForTorn(token.div(2)));
            expect(await mExitQueue.nextValue()).equal(await mRootManger.valueForTorn(token.div(2)));

            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            await mExitQueue.connect(user2).cancelQueue();
            expect(await mExitQueue.maxIndex()).equal(3);
            expect(await mExitQueue.preparedIndex()).equal(0);

            await expect(mExitQueue.connect(user2).cancelQueue()).revertedWith("empty");

            for(let i = 1 ; i < 200 ; i++){
                await mExitQueue.connect(user2).addQueueWithApproval(token.div(2));
                await mExitQueue.connect(user2).cancelQueue();
                expect(await mExitQueue.maxIndex()).equal(3+i);
                expect(await mExitQueue.preparedIndex()).equal(0);
            }
            // add a draw at the end of queue
            await mExitQueue.connect(user2).addQueueWithApproval(token.div(2));


            await expect(mExitQueue.connect(user1).UpdateSkipIndex()).revertedWith("skip is too short");
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(50000);
            await expect(mExitQueue.connect(user1).UpdateSkipIndex()).revertedWith("skip is too short");
            //  trigger executeQueue
            let last_toltal = await mRootManger.totalTorn();

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
            expect(await mExitQueue.connect(user1).withDraw());
            expect(about(await torn_erc20.connect(user1).balanceOf(user1.address),torn_last.add(stake_torn.div(2)))).equal(true);
            // unlock torn from gov staking
            await mDeposit.connect(user1).depositWithApproval(5000);
            //  trigger executeQueue
            await mDeposit.connect(user1).depositWithApproval(5000);

            await expect(mExitQueue.connect(user1).withDraw()).revertedWith("have no pending");
            torn_last = await torn_erc20.connect(user3).balanceOf(user3.address);
            await mExitQueue.connect(user3).withDraw();
            expect(about(await torn_erc20.connect(user3).balanceOf(user3.address),torn_last.add(stake_torn.div(2)))).true;

            torn_last = await torn_erc20.connect(user2).balanceOf(user2.address);
            await mExitQueue.connect(user2).withDraw();
            expect(about(await torn_erc20.connect(user2).balanceOf(user2.address),torn_last.add(stake_torn.div(2)))).true;


        });


    });

});
