import {expect} from "chai";
import {ethers} from "hardhat";

import {banlancOf, Coin2Tron, Fixture} from "./utils";
import {Deposit, Income, MERC20, MTornRouter, ProfitRecord, RootManger} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture, USER_FIX} from "./start_up";

describe("test_income", function () {
    let usdc_erc20: MERC20,torn_erc20: MERC20;


    let mTornRouter :MTornRouter;

    let mDeposit :Deposit;

    let mProfitRecord :ProfitRecord;
    let mIncome :Income;


    let fix_info: Fixture;
    let users :USER_FIX;
    let mRootManger :RootManger;
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
        await  mDeposit.connect(users.operator).setMaxReservePara(1, ethers.utils.parseUnits("50",18) );
        await  mDeposit.connect(users.operator).setMaxReservePara(2,ethers.utils.parseUnits("50",18) );
        await  mDeposit.connect(users.operator).setMaxReservePara(3,users.reward.address );
        await  mDeposit.connect(users.operator).setMaxReservePara(4,200 );
    });

    it("test fisrt newDeposit", async function () {

        let stake_torn = ethers.utils.parseUnits(Math.random()*100+"",18);
        await torn_erc20.connect(users.user3).mint(users.user3.address,stake_torn);
        await torn_erc20.connect(users.user3).approve(mDeposit.address,stake_torn.mul(100));
        await mDeposit.connect(users.user3).depositWithApproval(stake_torn);
        let root_token = mRootManger.balanceOf(users.user3.address);
        expect(await mProfitRecord.connect(users.user3).getProfit(users.user3.address,root_token)).equal(0);

    });



});
