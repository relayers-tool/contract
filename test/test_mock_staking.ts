import { expect } from "chai";
import { ethers } from "hardhat";
import {MERC20, MRelayerRegistry, MTornadoGovernanceStaking, MTornadoStakingRewards} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";

describe("MockTornadoGovernanceStaking", function () {
    let torn_erc20: MERC20;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;

    let mTornadoStakingRewards :MTornadoStakingRewards;
    let deployer1:SignerWithAddress,deployer2:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;

    beforeEach(async () => {
        // @ts-ignore
        [deployer1,deployer2,relayer1, relayer2,relayer3,user1,user2,user3,operator] = await ethers.getSigners();
        torn_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("torn","mock_torn",18);
        mTornadoGovernanceStaking = await (await ethers.getContractFactory("MTornadoGovernanceStaking")).deploy(torn_erc20.address);
        mTornadoStakingRewards = await (await ethers.getContractFactory("MTornadoStakingRewards")).deploy(mTornadoGovernanceStaking.address,torn_erc20.address);
        await mTornadoGovernanceStaking.setStakingRewardContract(mTornadoStakingRewards.address);
    });

    it("MockTornadoGovernanceStaking", async function () {
        await torn_erc20.mint(user1.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(user2.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(user3.address, ethers.utils.parseUnits("10000",18));

        //user 1 stake
        let stake_torn=ethers.utils.parseUnits("80",18);
        await torn_erc20.connect(user1).approve(mTornadoGovernanceStaking.address,stake_torn);
        await mTornadoGovernanceStaking.connect(user1).stake(stake_torn)
        expect(await mTornadoGovernanceStaking.connect(user1).totalSupply()).to.equal(stake_torn);
        expect(await mTornadoGovernanceStaking.connect(user1).balanceOf(user1.address)).to.equal(stake_torn);
        expect(await mTornadoGovernanceStaking.connect(user2).balanceOf(user2.address)).to.equal(0);
        expect(await mTornadoStakingRewards.connect(user2).checkReward(user1.address)).to.equal(0);

        //user 2 stake
        await torn_erc20.connect(user2).approve(mTornadoGovernanceStaking.address,stake_torn);
        await mTornadoGovernanceStaking.connect(user2).stake(stake_torn)
        expect(await mTornadoGovernanceStaking.connect(user1).totalSupply()).to.equal(stake_torn.mul(2));
        expect(await mTornadoGovernanceStaking.connect(user2).balanceOf(user2.address)).to.equal(stake_torn);
        expect(await mTornadoStakingRewards.connect(user2).checkReward(user2.address)).to.equal(0);

        // add reward first
        let reward=ethers.utils.parseUnits("80",18);
        await torn_erc20.connect(user3).approve(mTornadoGovernanceStaking.address,reward);
        await mTornadoGovernanceStaking.connect(user3).addRewardAmount(reward);

        expect(await torn_erc20.balanceOf(mTornadoStakingRewards.address)).to.equal(reward);
        let reward1 = await mTornadoStakingRewards.connect(user2).checkReward(user2.address);
        expect(reward1).to.equal(reward.div(2));

        let u2_banlance = await torn_erc20.connect(user2).balanceOf(user2.address);
        await mTornadoStakingRewards.connect(user2).getReward();
        expect(await torn_erc20.connect(user2).balanceOf(user2.address)).to.equal(u2_banlance.add(reward1));
        expect(await mTornadoStakingRewards.connect(user2).checkReward(user2.address)).to.equal(0);

        //add reward second
        await torn_erc20.connect(user3).approve(mTornadoGovernanceStaking.address,reward);
        await mTornadoGovernanceStaking.connect(user3).addRewardAmount(reward);
        expect(await mTornadoStakingRewards.connect(user1).checkReward(user1.address)).to.equal(reward);

        //user1 whit getReward
        let u1_banlance = await torn_erc20.connect(user1).balanceOf(user1.address);
        let user_reward  =await mTornadoStakingRewards.connect(user1).checkReward(user1.address);
        await mTornadoStakingRewards.connect(user1).getReward();
        expect(await torn_erc20.connect(user1).balanceOf(user1.address)).to.equal(u1_banlance.add(user_reward));
        expect(await mTornadoStakingRewards.connect(user1).checkReward(user1.address)).to.equal(0);

        //user2 whit whit draw
        let u1_banlance_draw = await torn_erc20.connect(user1).balanceOf(user1.address);
        await mTornadoGovernanceStaking.connect(user1).withdraw(reward);
        expect(await torn_erc20.connect(user1).balanceOf(user1.address)).to.equal(u1_banlance_draw.add(reward));
        expect(await mTornadoStakingRewards.connect(user1).checkReward(user1.address)).to.equal(0);


        //add reward third
        await torn_erc20.connect(user3).approve(mTornadoGovernanceStaking.address,reward);
        await mTornadoGovernanceStaking.connect(user3).addRewardAmount(reward);
        expect(await mTornadoStakingRewards.connect(user2).checkReward(user2.address)).to.equal(reward.mul(3).div(2));


    });
});
