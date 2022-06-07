import {ethers} from "hardhat";
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
import {BaseContract, BigNumber} from "ethers";


export interface Fixture {
    usdc_erc20: MERC20;dai_erc20: MERC20;torn_erc20: MERC20;weth_erc20: MERC20;
    mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    mRelayerRegistry :MRelayerRegistry;
    mTornadoStakingRewards :MTornadoStakingRewards;

    mTornRouter :MTornRouter;
    mRootManger:RootManger;
    mDeposit :Deposit;
    mExitQueue :ExitQueue;
    mIncome :Income;
    mockSwap :MockSwap;
    deployer1:SignerWithAddress;deployer2:SignerWithAddress;relayer1:SignerWithAddress;
    relayer2:SignerWithAddress;relayer3:SignerWithAddress;user1:SignerWithAddress;user2:SignerWithAddress;user3:SignerWithAddress;operator:SignerWithAddress ;
    stake1:SignerWithAddress;stake2:SignerWithAddress;stake3:SignerWithAddress;
    dao_relayer1:SignerWithAddress;dao_relayer2:SignerWithAddress;dao_relayer3:SignerWithAddress;owner:SignerWithAddress;
}

export async function createFixture(is_reg_relayer:boolean) :Promise<Fixture>{
    let usdc_erc20: MERC20,dai_erc20: MERC20,torn_erc20: MERC20,weth_erc20: MERC20;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    let mRelayerRegistry :MRelayerRegistry;
    let mTornadoStakingRewards :MTornadoStakingRewards;

    let mTornRouter :MTornRouter;
    let mRootManger:RootManger;
    let mDeposit :Deposit;
    let mExitQueue :ExitQueue;
    let mIncome :Income;
    let mockSwap :MockSwap;
    let owner:SignerWithAddress;
    let deployer1:SignerWithAddress,deployer2:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress,stake3:SignerWithAddress;
    let dao_relayer1:SignerWithAddress,dao_relayer2:SignerWithAddress,dao_relayer3:SignerWithAddress;

    // @ts-ignore
    [deployer1,deployer2,relayer1, relayer2,relayer3,user1,user2,user3,operator,stake1,stake2,stake3,dao_relayer1,dao_relayer2,dao_relayer3,owner] = await ethers.getSigners();
    usdc_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("usdc","mock_usdc",6);
    dai_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("dai","mock_dai",18);
    torn_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("torn","mock_torn",18);
    weth_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("weth","mock_weth",18);

    mockSwap =  await (await ethers.getContractFactory("MockSwap")).deploy(weth_erc20.address);
    mTornadoGovernanceStaking = await (await ethers.getContractFactory("MTornadoGovernanceStaking")).deploy(torn_erc20.address);
    mRelayerRegistry = await (await ethers.getContractFactory("MRelayerRegistry")).deploy(mTornadoGovernanceStaking.address,torn_erc20.address);
    mTornadoStakingRewards = await (await ethers.getContractFactory("MTornadoStakingRewards")).deploy(mTornadoGovernanceStaking.address,torn_erc20.address);
    await mTornadoGovernanceStaking.setStakingRewardContract(mTornadoStakingRewards.address);

    mRootManger = await (await ethers.getContractFactory("RootManger")).deploy(mRelayerRegistry.address,torn_erc20.address);

    mIncome = await (await ethers.getContractFactory("Income")).deploy(mockSwap.address,weth_erc20.address,torn_erc20.address,mRootManger.address);
    mTornRouter = await (await ethers.getContractFactory("MTornRouter")).deploy(usdc_erc20.address,dai_erc20.address,mIncome.address,mRelayerRegistry.address);

    mDeposit = await (await ethers.getContractFactory("Deposit")).deploy(torn_erc20.address,mTornadoGovernanceStaking.address,mRelayerRegistry.address,mRootManger.address);

    mExitQueue = await (await ethers.getContractFactory("ExitQueue")).deploy(torn_erc20.address,mRootManger.address);

    await mRootManger.__RootManger_init(mIncome.address,mDeposit.address,mExitQueue.address);


    await mRootManger.setOperator(operator.address);
    await mDeposit.__Deposit_init();
    await mExitQueue.__ExitQueue_init();
    //give enough torn for swap
    await torn_erc20.mint(mockSwap.address, ethers.utils.parseUnits("1000000",18));


    if(is_reg_relayer){
        //register relayers
        //give torn to relayers
        await torn_erc20.mint(relayer1.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(relayer2.address, ethers.utils.parseUnits("10000",18));
        await torn_erc20.mint(relayer3.address, ethers.utils.parseUnits("10000",18));

        let stake_value = ethers.utils.parseUnits("5000",18);
        await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address,stake_value.mul(5));

        await mRelayerRegistry.connect(relayer1).register(relayer1.address,stake_value);
        await torn_erc20.connect(relayer2).approve(mRelayerRegistry.address,stake_value);
        await mRelayerRegistry.connect(relayer2).register(relayer2.address,stake_value);
        await torn_erc20.connect(dao_relayer1).approve(mRelayerRegistry.address,stake_value);
        await mRelayerRegistry.connect(dao_relayer1).register(dao_relayer1.address,0);

        await mRootManger.connect(deployer1).transferOwnership(owner.address);
        await mRootManger.connect(owner).addRelayer(dao_relayer1.address,0);

        //initialize fist stake avoid dive 0
        let stake_torn=ethers.utils.parseUnits("1",18);
        await torn_erc20.mint(stake1.address,stake_torn);
        await torn_erc20.connect(stake1).approve(mTornadoGovernanceStaking.address,stake_torn);
        await mTornadoGovernanceStaking.connect(stake1).stake(stake_torn)
    }



    return {
        usdc_erc20,dai_erc20,torn_erc20,weth_erc20,
         mTornadoGovernanceStaking,
     mRelayerRegistry,
     mTornadoStakingRewards,
     mTornRouter,
     mRootManger,
     mDeposit,
     mExitQueue,
     mIncome,
     mockSwap,
     deployer1,deployer2,relayer1,
     relayer2,relayer3,user1,user2,user3,operator,
     stake1,stake2,stake3,
     dao_relayer1,dao_relayer2,dao_relayer3,owner
    };

}


export  async function banlancOf  (info:Fixture, type:string, user:any) {
    switch (type) {
        case "usdc":{
            return await info.usdc_erc20.balanceOf(user.address);
            break;
        }
        case "dai":{
            return await info.dai_erc20.balanceOf(user.address);
            break;
        }
        case "torn":{
            return await info.torn_erc20.balanceOf(user.address);
            break;
        }
        case "eth":{
            if(user instanceof (BaseContract)){
                return  await info.mIncome.connect(info.mIncome.address).signer.getBalance();
            }
            return await user.getBalance();
        }
    }
    throw "err";
}

export  async function  getGovRelayerReward(info:Fixture, type:string, value:BigNumber) {
    let allFeeRate =  await info.mTornRouter.allFeeRate();
    return ( (value.mul(allFeeRate).div(10000)));

}

export  function about ( value1:BigNumber,value2:BigNumber)  {
    return value1.sub(value2).abs().lte(value1.div(10**10))&&value1.sub(value2).abs().lte(value2.div(10**10));
}



export  async function  getGovStakeReward (info:Fixture, type:string, value:BigNumber)  {
    let allFeeRate =  await info.mTornRouter.allFeeRate();
    let stakeFeeRate = await info.mTornRouter.stakeFeeRate();
    return (await  info.mTornRouter.Coin2Tron(type,value.mul(allFeeRate).div(10000))).mul(stakeFeeRate).div(allFeeRate);

}

export  async function  Coin2Tron (info:Fixture, type:string, value:BigNumber)  {
    return (await  info.mTornRouter.Coin2Tron(type,value));
}
