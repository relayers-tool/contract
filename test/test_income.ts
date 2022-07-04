import {expect} from "chai";
import {ethers} from "hardhat";

import {banlancOf, Coin2Tron, Fixture} from "./utils";
import {Deposit, Income, MERC20, MTornRouter} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture} from "./start_up";

describe("test_income", function () {
    let usdc_erc20: MERC20, torn_erc20: MERC20;


    let mTornRouter: MTornRouter;

    let mDeposit: Deposit;

    let mIncome: Income;

    let user1: SignerWithAddress, user2: SignerWithAddress, user3: SignerWithAddress, operator: SignerWithAddress;
    let stake1: SignerWithAddress;

    let fix_info: Fixture;

    beforeEach(async () => {
        fix_info = await set_up_fixture("register_relayers");
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

        let stake_torn = ethers.utils.parseUnits("50", 18);
        await torn_erc20.connect(stake1).mint(stake1.address, stake_torn.mul(1000));

        await torn_erc20.connect(stake1).approve(mDeposit.address, stake_torn);
        await mDeposit.connect(stake1).depositWithApproval(stake_torn);


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


    });


    it("test distribute_torn", async function () {
        let eth_value = await banlancOf(fix_info, "eth", mIncome);
        let torn = await Coin2Tron(fix_info, "eth", eth_value);
        await expect(mIncome.connect(operator).distributeTorn(torn)).to.be.emit(mIncome, "distribute_torn")
            .withArgs(torn);
    });


});
