import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MockSwap,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter, ProfitRecord,
    RootManger
} from "../typechain-types";
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
    mProfitRecord:ProfitRecord
}

const delay = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms))


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
    console.log(value1,value2);
    if(value1.sub(value2).abs().gt(200)){
        return false;
    }
    return value1.sub(value2).abs().lte(value1.div(10**10))&&value1.sub(value2).abs().lte(value2.div(10**10));
}
export  function almost ( value1:BigNumber,value2:BigNumber)  {
    if(value1.sub(value2).abs().lte(50)){
        return true;
    }
}





export  async function  getGovStakeReward (info:Fixture, type:string, value:BigNumber)  {
    let allFeeRate =  await info.mTornRouter.allFeeRate();
    let stakeFeeRate = await info.mTornRouter.stakeFeeRate();
    return (await  info.mTornRouter.Coin2Tron(type,value.mul(allFeeRate).div(10000))).mul(stakeFeeRate).div(allFeeRate);

}

export  async function  Coin2Tron (info:Fixture, type:string, value:BigNumber)  {
    return (await  info.mTornRouter.Coin2Tron(type,value));
}
