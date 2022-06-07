import { expect } from "chai";
import { ethers } from "hardhat";

import {createFixture, Fixture, banlancOf, getGovRelayerReward, Coin2Tron, about} from "./utils";
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
import {BigNumber} from "@ethersproject/bignumber";
import {signERC2612Permit} from "eth-permit";
describe("test_deposit", function () {
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

    });

    describe("test setMaxReservePara", function () {
        let stake_torn=ethers.utils.parseUnits("50",18);

        beforeEach(async () => {
            await torn_erc20.connect(user1).mint(user1.address,stake_torn);
            await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn);
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
        });

        it("case1 : test operator", async function () {

           let  maxReserveTorn  =ethers.utils.parseUnits(Math.random()*10+"",18);
            let maxRewardInGov  =ethers.utils.parseUnits(Math.random()*10+"",18);

            await expect( mDeposit.connect(user1).setMaxReservePara(maxReserveTorn,maxRewardInGov)).to.be.revertedWith("Caller is not operator");

        });

        it("case2 : test result", async function () {
            let  maxReserveTorn  =ethers.utils.parseUnits(Math.random()*10+"",18);
            let maxRewardInGov  =ethers.utils.parseUnits(Math.random()*10+"",18);
            await  mDeposit.connect(operator).setMaxReservePara(maxReserveTorn,maxRewardInGov);
            expect(await  mDeposit.maxReserveTorn()).to.be.equal(maxReserveTorn);
            expect(await  mDeposit.maxRewardInGov()).to.be.equal(maxRewardInGov);
        });

    });

    describe("test deposit(uint256 _amount,uint256 deadline, uint8 v, bytes32 r, bytes32 s)", function () {

        it("case1 :  test deposit", async function () {
            let stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await torn_erc20.connect(user1).mint(user1.address,stake_torn);
            const allowanceParameters = await signERC2612Permit(user1, torn_erc20.address,user1.address, mDeposit.address, stake_torn.toBigInt().toString()); //Sign operation
            expect(await mRootManger.balanceOf(mDeposit.address)).equal(0);
            await mDeposit.connect(user1).deposit(stake_torn,allowanceParameters.deadline,allowanceParameters.v,allowanceParameters.r,allowanceParameters.s);
            expect(await mRootManger.totalTorn()).equal(stake_torn);
            await expect(mDeposit.connect(user1).deposit(stake_torn.div(2),allowanceParameters.deadline,allowanceParameters.v,allowanceParameters.r,allowanceParameters.s))
                .revertedWith("ERC20Permit: invalid signature");
        });

    });


    describe("isBalanceEnough(uint256 _amount_token)", function () {

        it("case1 test isBalanceEnough", async function () {
           // await mDeposit.getValueShouldUnlock(500);
            //await mRootManger.balanceOf(mDeposit.address)
            // console.log(await torn_erc20.balanceOf(mDeposit.address));
            // console.log(await mDeposit.isBalanceEnough((await mRootManger.totalSupply()).mul(500)));
            // expect(await mDeposit.isBalanceEnough(500)).equal(false);
            // await mDeposit.connect(user1).deposit(stake_torn,allowanceParameters.deadline,allowanceParameters.v,allowanceParameters.r,allowanceParameters.s);
            // expect(await mRootManger.totalTorn()).equal(stake_torn);
            // await expect(mDeposit.connect(user1).deposit(stake_torn.div(2),allowanceParameters.deadline,allowanceParameters.v,allowanceParameters.r,allowanceParameters.s))
            //     .revertedWith("ERC20Permit: invalid signature");
        });

    });


    describe("test depositWithApproval", function () {
        let stake_torn:BigNumber =  BigNumber.from(0);

        beforeEach(async () => {

        });

        it("case1 : test Insufficient", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await torn_erc20.connect(user3).mint(user3.address,stake_torn);
            await torn_erc20.connect(user3).approve(mDeposit.address,stake_torn);
            await expect(mDeposit.connect(user3).depositWithApproval(stake_torn.mul(100))).to.be.revertedWith("ERC20: insufficient allowance");
        });

        it("case:2-1 : test succeed ", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            expect(await mRootManger.totalRelayerTorn()).to.be.equal(0);
            await torn_erc20.connect(user3).mint(user3.address,stake_torn);
            await torn_erc20.connect(user3).approve(mDeposit.address,stake_torn);
            await mDeposit.connect(user3).depositWithApproval(stake_torn);
            expect(await mRootManger.totalTorn()).to.be.equal(stake_torn);


            await torn_erc20.connect(user1).mint(user1.address,stake_torn.mul(3));
            await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn.mul(3));
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(3));
            expect(await mRootManger.totalTorn()).to.be.equal(stake_torn.mul(4));
            expect((await mRootManger.balanceOf(user1.address)).div(await mRootManger.balanceOf(user3.address) )).to.be.equal(3);
        });

        it("case:2-2 : reward is correct ", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            expect(await mRootManger.totalRelayerTorn()).to.be.equal(0);
            await torn_erc20.connect(user3).mint(user3.address,stake_torn);
            await torn_erc20.connect(user3).approve(mDeposit.address,stake_torn);
            await mDeposit.connect(user3).depositWithApproval(stake_torn);

            await torn_erc20.connect(user1).mint(user1.address,stake_torn.mul(3));
            await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn.mul(3));
            await mDeposit.connect(user1).depositWithApproval(stake_torn.mul(3));

            //add reward to mIncome
            await torn_erc20.connect(user3).mint(mIncome.address,stake_torn);
            expect(await mRootManger.totalTorn()).to.be.equal(stake_torn.mul(5));
            await mIncome.connect(operator).distributeTorn(stake_torn);
            expect(await mRootManger.totalTorn()).to.be.equal(stake_torn.mul(5));
             expect((await  mRootManger.balanceOfTorn(user1.address)).div(await  mRootManger.balanceOfTorn(user3.address)))
                 .to.be.equal(3)
        });

        it("case 2-3.isNeedClaimFromGov", async function () {

            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await torn_erc20.connect(user3).mint(user3.address,stake_torn.mul(2));
            await torn_erc20.connect(user3).approve(mDeposit.address,stake_torn.mul(2));
            let staking_to_gov_1 = await mTornadoGovernanceStaking.lockedBalance(mDeposit.address);
            expect(staking_to_gov_1).to.be.equal(0);
            await mDeposit.connect(operator).setMaxReservePara(500,500);
            await mDeposit.connect(user3).depositWithApproval(stake_torn);
            expect(await mTornadoGovernanceStaking.lockedBalance(mDeposit.address)).to.be.equal(stake_torn);
            expect(await mDeposit.maxReserveTorn()).to.be.gt(await torn_erc20.balanceOf(mDeposit.address))

            expect( await mTornadoStakingRewards.checkReward(mDeposit.address)).to.equal(0);
            //deposit eth for test
            let eth = ethers.utils.parseUnits("1000",18);
            let counter = 20

            for(let i = 0 ; i < counter ; i++) {
                await  mTornRouter.connect( user1).deposit("eth", eth, {value: eth});
                await  mTornRouter.connect( user1).withdraw("eth", eth,  user2.address);
            }
            let reward = await mTornadoStakingRewards.checkReward(mDeposit.address);
            expect(reward).gt(500);
            //deposit to tirger the ClaimFromGov
            await mDeposit.connect(user3).depositWithApproval(stake_torn.div(50));
            expect(await mTornadoStakingRewards.checkReward(mDeposit.address)).to.equal(0);


        });



        it("case 2-4. isNeedTransfer2Queue \n  case 2-5.UnlockFromGov \n 2-6._checkLock2Gov", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            expect(await mRootManger.totalRelayerTorn()).to.be.equal(0);
            await torn_erc20.connect(user3).mint(user3.address,stake_torn.mul(50));
            await torn_erc20.connect(user3).approve(mDeposit.address,stake_torn.mul(10));
            await mDeposit.connect(operator).setMaxReservePara(stake_torn.div(10),stake_torn);
            //_checkLock2Gov
            await expect(mDeposit.connect(user3).depositWithApproval(stake_torn)).to.be.emit(mDeposit, "lock_to_gov")
                .withArgs(stake_torn);
            expect(await mRootManger.totalTorn()).to.be.equal(stake_torn);

          expect(await torn_erc20.balanceOf(mDeposit.address)).to.be.equal(0);
           let token = await mRootManger.balanceOf(user3.address);
            await mRootManger.connect(user3).approve(mExitQueue.address,(token).mul(50));
         await expect(mExitQueue.connect(user3).addQueueWithApproval(token)).to
               .be.emit(mExitQueue,"add_queue").withArgs(token);
            expect(await mExitQueue.nextValue()).to.be.equal(stake_torn);
            let shortage = await mDeposit.getValueShouldUnlockFromGov();
            expect(shortage).gt(0);
           // console.log("totalSupply",await mRootManger.totalSupply(),"token",token,"mExitQueue:",await mRootManger.balanceOfTorn(mExitQueue.address));
            // // UnlockFromGov
           await mDeposit.connect(user3).depositWithApproval(2000000);
          //  console.log("totalSupply",await mRootManger.totalSupply(),"token",token,"mExitQueue:",await mRootManger.balanceOfTorn(mExitQueue.address));
           //
           //  // Transfer2Queue
           await mDeposit.connect(user3).depositWithApproval(2000000);
            let next_value = await mExitQueue.nextValue();
            expect(next_value).equal(0);
            // todo  here have some errors ,is it seriousness ?
            expect(about(await torn_erc20.balanceOf(mExitQueue.address),stake_torn)).to.true;

        });


    });



    describe("test withdraw", function () {
        let stake_torn=ethers.utils.parseUnits("50",18);

        // beforeEach(async () => {
        //     await torn_erc20.connect(user1).mint(user1.address,stake_torn);
        //     await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn);
        //     await mDeposit.connect(user1).depositWithApproval(stake_torn);
        // });

        it("case1 : : test Insufficient", async function () {

            await expect(mDeposit.connect(user1).withDraw(stake_torn)).to.be.revertedWith("balance Insufficient")

        });

        it("case2 : : Queue is not empty or pool Insufficient", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await mDeposit.connect(operator).setMaxReservePara(stake_torn.mul(10),500);
            await torn_erc20.mint(user1.address,stake_torn.mul(100));
            await torn_erc20.mint(user2.address,stake_torn.mul(100));
            await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn.mul(10))
            await torn_erc20.connect(user2).approve(mDeposit.address,stake_torn.mul(10))
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            await mDeposit.connect(user2).depositWithApproval(stake_torn);
            expect(await torn_erc20.balanceOf(mDeposit.address)).to.equal(stake_torn.mul(2));
            expect(await mRootManger.totalTorn()).equal(stake_torn.mul(2));

            await mDeposit.connect(operator).stake2Node(0,stake_torn.mul(3).div(2));
            let  token = await mRootManger.balanceOf(user1.address);

            expect((await mDeposit.getValueShouldUnlock(token)).torn).equal(stake_torn) ;
            await expect(mDeposit.connect(user1).withDraw(token)).to.revertedWith("pool Insufficient");

            await   mRootManger.connect(user1).approve(mExitQueue.address,token);
            await mExitQueue.connect(user1).addQueueWithApproval(token);

            expect((await mDeposit.getValueShouldUnlock(token)).torn).equal(stake_torn) ;
            await expect(mDeposit.connect(user1).withDraw(token)).to.revertedWith("Queue not empty");
        });

        it("case3  : use gov staking for withdraw", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            await torn_erc20.mint(user1.address,stake_torn.mul(100));
            await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn.mul(10))
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            expect(await mRootManger.totalTorn()).equal(stake_torn);
             let  token = await mRootManger.balanceOf(user1.address);
            expect(await mTornadoGovernanceStaking.lockedBalance(mDeposit.address)).equal(stake_torn);
            expect((await mDeposit.getValueShouldUnlock(token)).torn).equal(stake_torn) ;
            await mDeposit.connect(user1).withDraw(token);
           expect(await mTornadoGovernanceStaking.lockedBalance(mDeposit.address)).equal(0);

        });


        it("case4  : withdraw by Deposit balance", async function () {
            stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
            stake_torn = stake_torn.mul(2);
            await torn_erc20.mint(user1.address,stake_torn.mul(100));
            await torn_erc20.connect(user1).approve(mDeposit.address,stake_torn.mul(10))
            await mDeposit.connect(operator).setMaxReservePara(stake_torn.mul(10),500);
            await mDeposit.connect(user1).depositWithApproval(stake_torn);
            expect(await mRootManger.totalTorn()).equal(stake_torn);
            let  token = await mRootManger.balanceOf(user1.address);
            await mDeposit.connect(user1).withDraw(token.div(2));
            expect(await mRootManger.totalTorn()).equal(stake_torn.div(2));

        });

    });




    // it("case dummy : ", async function () {
    //     // let banlnce_torn = await torn_erc20.balanceOf(mDeposit.address);
    //     // expect(banlnce_torn).to.gt(0);
    //     // await expect(mDeposit.connect(operator).lock2Gov(banlnce_torn.div(2),true)).to.be.emit(mDeposit, "lock_to_gov")
    //     //     .withArgs(banlnce_torn.div(2),true);
    // });



});
