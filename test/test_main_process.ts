import {expect} from "chai";
import {ethers} from "hardhat";

import {banlancOf, Fixture, getGovRelayerReward} from "./utils";
import {
    Deposit,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornRouter,
    RootManger
} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, set_up_fixture, USER_FIX} from "./start_up";

describe("main_process", function () {
    let usdc_erc20: MERC20,torn_erc20: MERC20;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    let mRelayerRegistry :MRelayerRegistry;


    let mTornRouter :MTornRouter;
    let mRootManger:RootManger;
    let mDeposit :Deposit;

    let mIncome :Income;
    let relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress;

    let fix_info :Fixture;
    let users: USER_FIX;
    beforeEach(async () => {
        users = await get_user_fixture()

        fix_info = await set_up_fixture("test_net");
         usdc_erc20 = fix_info.usdc_erc20;
        torn_erc20 = fix_info.torn_erc20;
        mTornadoGovernanceStaking = fix_info.mTornadoGovernanceStaking;
        mRelayerRegistry = fix_info.mRelayerRegistry;
        mTornRouter = fix_info.mTornRouter;
        mRootManger = fix_info.mRootManger;
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

        //register relayers
        //give torn to relayers
        await  torn_erc20.mint( relayer1.address, ethers.utils.parseUnits("100000000000",18));
        await  torn_erc20.mint( relayer2.address, ethers.utils.parseUnits("10000",18));
        await  torn_erc20.mint( relayer3.address, ethers.utils.parseUnits("10000",18));

        let stake_value = ethers.utils.parseUnits("5000",18);
        await  torn_erc20.connect( relayer1).approve( mRelayerRegistry.address,stake_value);
        await  mRelayerRegistry.connect( relayer1).register( relayer1.address,stake_value);
        // await  torn_erc20.connect( relayer2).approve( mRelayerRegistry.address,stake_value);
        // await  mRelayerRegistry.connect( relayer2).register( relayer2.address,stake_value);


         await  torn_erc20.mint( user1.address, ethers.utils.parseUnits("10000",18));
         await  torn_erc20.mint( user2.address, ethers.utils.parseUnits("10000",18));
         await  torn_erc20.mint( stake1.address, ethers.utils.parseUnits("10000",18));
         await  torn_erc20.mint( stake2.address, ethers.utils.parseUnits("10000",18));

          stake_value = ethers.utils.parseUnits("5000",18);
         await  usdc_erc20.mint( user1.address,stake_value);


    });




    describe('main_process', () => {
        it("main_process", async function () {
            let stake_torn=ethers.utils.parseUnits("50",18);
            await  torn_erc20.connect( stake1).approve( mTornadoGovernanceStaking.address,stake_torn);
            await  mTornadoGovernanceStaking.connect( stake1).stake( stake_torn);
            // avoid to stake to govstaking
            await mDeposit.connect(operator).setPara(1,stake_torn.mul(10000000));
            await mDeposit.connect(operator).setPara(2,stake_torn.mul(10000000));
            expect(await  mTornadoGovernanceStaking.connect( stake1).balanceOf( stake1.address)).to.equal(stake_torn);
            expect(await  mTornadoGovernanceStaking.connect( stake2).balanceOf( stake2.address)).to.equal(0);
            await  torn_erc20.connect( stake2).approve( mDeposit.address,stake_torn);
            await  mDeposit.connect( stake2).depositWithApproval(stake_torn);

            expect(stake_torn).to.equal(await  mRootManger.connect( stake2).balanceOfTorn( stake2.address));

            // deposit usdc for test
            let usdc = ethers.utils.parseUnits("1",6);
            await  usdc_erc20.connect( user1).approve( mTornRouter.address,usdc);
            await  mTornRouter.connect( user1).deposit("usdc",usdc);
            await  mTornRouter.connect( user1).withdraw("usdc",usdc, user2.address);


            let income = await banlancOf(fix_info,"usdc", relayer1);
            let reward = await getGovRelayerReward(fix_info,"usdc",usdc);
            expect(income).to.equal(reward);
            let banlance1 = await banlancOf(fix_info,"eth", relayer1);

            //deposit eth for test
            let eth = ethers.utils.parseUnits("1000",18);
            let counter = 20

            for(let i = 0 ; i < counter ; i++) {
                await  mTornRouter.connect( user1).deposit("eth", eth, {value: eth});
                await  mTornRouter.connect( user1).withdraw("eth", eth,  user2.address);
            }
            let income_eth = await banlancOf(fix_info,"eth", relayer1);

            expect((await banlancOf(fix_info,"eth", relayer1)).sub(banlance1)).to.equal(await  getGovRelayerReward(fix_info,"eth",eth.mul(20)));

            //swap income eth to torn
            let eth_to_torn = await   mTornRouter.Coin2Tron("eth",income_eth);
            await torn_erc20.connect(relayer1).approve(mIncome.address,eth_to_torn);
            await torn_erc20.connect(relayer1).transfer(mIncome.address,eth_to_torn);
            await  mIncome.connect( operator).distributeTorn(eth_to_torn);

            expect(await  mRootManger.connect(stake2).balanceOfTorn(stake2.address)).to.equal(stake_torn.add(eth_to_torn));
            let relay_lost =  (await  mRelayerRegistry.getRelayerBalance( relayer1.address)).add(await  mRelayerRegistry.getRelayerBalance( relayer2.address));



        });
    })
});
