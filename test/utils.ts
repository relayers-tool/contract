import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    ProfitRecord,
    RootDB
} from "../typechain-types";
import {BaseContract, BigNumber} from "ethers";
import {get_user_fixture, USER_FIX} from "./start_up";

export interface Fixture {
    usdc_erc20: MERC20;
    dai_erc20: MERC20;
    torn_erc20: MERC20;
    weth_erc20: MERC20;
    mTornadoGovernanceStaking: MTornadoGovernanceStaking;
    mRelayerRegistry: MRelayerRegistry;
    mTornadoStakingRewards: MTornadoStakingRewards;
    mTornRouter: MTornRouter;
    mRootDb: RootDB;
    mDeposit: Deposit;
    mExitQueue: ExitQueue;
    mIncome: Income;
    mProfitRecord: ProfitRecord
}

async function getAllRelayers(info: Fixture) {
    let ret_arr = [];
    let counter = (await info.mRelayerRegistry.counter()).toBigInt();
    while (counter--) {
        ret_arr.push(await info.mRelayerRegistry.array(counter))
    }
    return ret_arr.filter(value => {
        return (value.toString().indexOf("00000000000000000") == -1);
    });
}

async function getDaoRelayers(info: Fixture) {
    let ret_arr = [];
    let counter = (await info.mRootDb.MAX_RELAYER_COUNTER()).toBigInt();
    while (counter--) {
        ret_arr.push(await info.mRootDb.mRelayers(counter))
    }
    return ret_arr.filter(value => {
        return (value.toString().indexOf("00000000000000000") == -1);
    });
}


export async function TornUserSimulate(info: Fixture, type: string, each_value: BigNumber, counter: BigNumber, is_distribute: boolean) {

    let user_fix: USER_FIX = await get_user_fixture();
    let eth: BigNumber = type.includes("eth") ? each_value : BigNumber.from(0);
    let erc_20: MERC20 | null = null;

    switch (type) {
        case "dai": {
            erc_20 = info.dai_erc20;
            break;
        }
        case "usdc": {
            erc_20 = info.usdc_erc20;
            break;
        }
    }
    if (erc_20) {
        await erc_20.connect(user_fix.user1).mint(user_fix.user1.address, each_value.mul(counter));
        await erc_20.connect(user_fix.user1).approve(info.mTornRouter.address, each_value.mul(counter));
    }

    for (let i = 0; i < counter.toNumber(); i++) {
        await info.mTornRouter.connect(user_fix.user1).deposit(type, each_value, {value: eth});
        await info.mTornRouter.connect(user_fix.user1).withdraw(type, each_value, user_fix.user2.address);
    }


    let relayer_reward = await getAllRelayerReward(info, type, each_value.mul(counter));
    let relayer_reward_torn = await info.mTornRouter.Coin2Tron(type, relayer_reward);

    let gov_staking_reward = await getGovStakingReward(info, type, each_value.mul(counter));
    let gov_staking_reward_torn = await info.mTornRouter.Coin2Tron(type, gov_staking_reward);

    if (is_distribute) {
        let arr2 = await getAllRelayers(info);
        let arr3 = await getDaoRelayers(info);

        let result = arr2.concat(arr3).filter(function (v) {
            return arr2.indexOf(v) === -1 || arr3.indexOf(v) === -1
        });

        if (result.length > 0) {
            console.warn("there are some relayer ,not in dao", result);
        }


        await info.torn_erc20.mint(user_fix.user1.address, relayer_reward_torn);
        await info.torn_erc20.connect(user_fix.user1).transfer(info.mIncome.address, gov_staking_reward_torn);
        await info.mIncome.connect(user_fix.operator).distributeTorn(gov_staking_reward_torn);
    }
    return {
        relayer_rev_torn: relayer_reward_torn,
        gov_rev_torn: gov_staking_reward_torn,
    };
}


const delay = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms))


export async function banlancOf(info: Fixture, type: string, user: any) {
    switch (type) {
        case "usdc": {
            return await info.usdc_erc20.balanceOf(user.address);
            break;
        }
        case "dai": {
            return await info.dai_erc20.balanceOf(user.address);
            break;
        }
        case "torn": {
            return await info.torn_erc20.balanceOf(user.address);
            break;
        }
        case "eth": {
            if (user instanceof (BaseContract)) {
                return await info.mIncome.connect(info.mIncome.address).signer.getBalance();
            }
            return await user.getBalance();
        }
    }
    throw "err";
}

export async function getAllRelayerReward(info: Fixture, type: string, value: BigNumber) {
    let allFeeRate = await info.mTornRouter.allFeeRate();
    return ((value.mul(allFeeRate).div(10000)));

}

export async function getGovStakingReward(info: Fixture, type: string, value: BigNumber) {
    let allFeeRate = await info.mTornRouter.stakeFeeRate();
    return ((value.mul(allFeeRate).div(10000)));
}


export function about(value1: BigNumber, value2: BigNumber) {
    if (value1.sub(value2).abs().gt(200)) {
        console.log("value1", value1, "value2", value2);
        return false;
    }
    let ret = value1.sub(value2).abs().lte(value1.div(10 ** 10)) && value1.sub(value2).abs().lte(value2.div(10 ** 10));
    if (!ret) {
        console.log("value1", value1, "value2", value2);
    }
    return ret;
}

export function almost(value1: BigNumber, value2: BigNumber) {
    if (value1.sub(value2).abs().lte(50)) {
        return true;
    }
}


export async function getGovStakeReward(info: Fixture, type: string, value: BigNumber) {
    let allFeeRate = await info.mTornRouter.allFeeRate();
    let stakeFeeRate = await info.mTornRouter.stakeFeeRate();
    return (await info.mTornRouter.Coin2Tron(type, value.mul(allFeeRate).div(10000))).mul(stakeFeeRate).div(allFeeRate);

}

export async function Coin2Tron(info: Fixture, type: string, value: BigNumber) {
    return (await info.mTornRouter.Coin2Tron(type, value));
}
