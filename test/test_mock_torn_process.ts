import { expect } from "chai";
import { ethers } from "hardhat";
import {BigNumber, BigNumberish,  Signer} from "ethers";

import {about, banlancOf, Fixture, getGovStakeReward, createFixture} from "./utils";
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
describe("main_process", function () {

    let usdc_erc20: MERC20,dai_erc20: MERC20,torn_erc20: MERC20;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    let mRelayerRegistry :MRelayerRegistry;
    let mTornadoStakingRewards :MTornadoStakingRewards;

    let mTornRouter :MTornRouter;
    let deployer1:SignerWithAddress,deployer2:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress;



    let relayer_stake_value:BigNumber;

    let info :Fixture;
    beforeEach(async () => {
        info = await createFixture(false);

        usdc_erc20 =info.usdc_erc20;
        dai_erc20 = info.dai_erc20;
        torn_erc20 =info.torn_erc20;
        mTornadoGovernanceStaking = info.mTornadoGovernanceStaking;
        mRelayerRegistry = info.mRelayerRegistry;
        mTornadoStakingRewards = info.mTornadoStakingRewards;
        mTornRouter = info.mTornRouter;
        relayer1 = info.relayer1;
        relayer2 = info.relayer2;
        relayer3 = info.relayer3;
        user1 = info.user1;
        user2 = info.user2;
        stake1 = info.stake1;
        stake2 = info.stake2;

        //give torn to relayers
        await torn_erc20.mint(relayer1.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(relayer2.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(relayer3.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(user1.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(user2.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(stake1.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(stake2.address, ethers.utils.parseUnits("10000",18));
        //register relayers
        relayer_stake_value = ethers.utils.parseUnits("5000",18);
        await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address,relayer_stake_value);
        await mRelayerRegistry.connect(relayer1).register(relayer1.address,relayer_stake_value);
        await torn_erc20.connect(relayer2).approve(mRelayerRegistry.address,relayer_stake_value);
        await mRelayerRegistry.connect(relayer2).register(relayer2.address,relayer_stake_value);

        await usdc_erc20.mint(user1.address,relayer_stake_value);


        let stake_torn=ethers.utils.parseUnits("50",18);
        await torn_erc20.connect(stake1).approve(mTornadoGovernanceStaking.address,stake_torn);
        await mTornadoGovernanceStaking.connect(stake1).stake( stake_torn)

        await torn_erc20.connect(stake2).approve(mTornadoGovernanceStaking.address,stake_torn);
        await mTornadoGovernanceStaking.connect(stake2).stake( stake_torn)

    });



    describe('getGovStakeReward', () => {
        it("test usdc", async function () {
            let usdc = ethers.utils.parseUnits("10000",6);
            let counter = 10
            for(let i = 0 ; i < counter ; i++){
                await usdc_erc20.connect(user1).approve(mTornRouter.address,usdc);
                await mTornRouter.connect(user1).deposit("usdc",usdc);
                await mTornRouter.connect(user1).withdraw("usdc",usdc,user2.address);
            }


            let re = (await mTornadoStakingRewards.checkReward(stake1.address)).add(await mTornadoStakingRewards.checkReward(stake2.address));
            let remaining = (await mRelayerRegistry.getRelayerBalance(relayer1.address)).add(await mRelayerRegistry.getRelayerBalance(relayer2.address));
            expect(relayer_stake_value.mul(2).sub(remaining)).to.equal(re);

            expect(about(re,await getGovStakeReward(info,"usdc",usdc.mul(counter)))).to.equal(true);
            expect(about(await banlancOf(info,"torn",mTornadoStakingRewards),await getGovStakeReward(info,"usdc",usdc.mul(counter)))).to.equal(true);

        });
    })


    describe('getGovStakeReward', () => {
        it("test dai", async function () {
            let dai = ethers.utils.parseUnits("10000",18);
            let counter = 10
            await dai_erc20.mint(user1.address,dai.mul(counter));

            for(let i = 0 ; i < counter ; i++){
                await dai_erc20.connect(user1).approve(mTornRouter.address,dai);
                await mTornRouter.connect(user1).deposit("dai",dai);
                await mTornRouter.connect(user1).withdraw("dai",dai,user2.address);
            }

            let re = (await mTornadoStakingRewards.checkReward(stake1.address)).add(await mTornadoStakingRewards.checkReward(stake2.address));
            let remaining = (await mRelayerRegistry.getRelayerBalance(relayer1.address)).add(await mRelayerRegistry.getRelayerBalance(relayer2.address));
            expect(relayer_stake_value.mul(2).sub(remaining)).to.equal(re);
            expect(about(re,await getGovStakeReward(info,"dai",dai.mul(counter)))).to.equal(true);
            expect(about(await banlancOf(info,"torn",mTornadoStakingRewards),await getGovStakeReward(info,"dai",dai.mul(counter)))).to.equal(true);

        });
    })


    describe('getGovStakeReward', () => {
        it("test eth", async function () {
            let eth = ethers.utils.parseUnits("10",18);
            let counter = 20

            for(let i = 0 ; i < counter ; i++){
                await mTornRouter.connect(user1).deposit("eth",eth,{value:eth});
                await mTornRouter.connect(user1).withdraw("eth",eth,user2.address);
            }

            let re = (await mTornadoStakingRewards.checkReward(stake1.address)).add(await mTornadoStakingRewards.checkReward(stake2.address));
            let remaining = (await mRelayerRegistry.getRelayerBalance(relayer1.address)).add(await mRelayerRegistry.getRelayerBalance(relayer2.address));
            expect(relayer_stake_value.mul(2).sub(remaining)).to.equal(re);
            expect(about(re,await getGovStakeReward(info,"eth",eth.mul(counter)))).to.equal(true);
            expect(about(await banlancOf(info,"torn",mTornadoStakingRewards),await getGovStakeReward(info,"eth",eth.mul(counter)))).to.equal(true);

        });
    })

});
