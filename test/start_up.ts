// We import the hardhat environment field we are planning to use
import {deployments, ethers} from 'hardhat';
import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter, ProfitRecord,
    RootDB
} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {expect} from "chai";


async function config_check(){
    const contracts = {
        mock_torn: (await deployments.get('mock_torn')).address,
        mock_dai: (await deployments.get('mock_dai')).address,
        mock_usdc: (await deployments.get('mock_usdc')).address,
        mock_weth: (await deployments.get('mock_weth')).address,
        mTornadoGovernanceStaking:(await deployments.get('MTornadoGovernanceStaking')).address,
        mRelayerRegistry:(await deployments.get('MRelayerRegistry')).address,
        mTornadoStakingRewards:(await deployments.get('MTornadoStakingRewards')).address,
        Deposit:(await deployments.get('Deposit')).address,
        RootManger:(await deployments.get('RootManger')).address,
        ExitQueue:(await deployments.get('ExitQueue')).address,
        Income:(await deployments.get('Income')).address,
        MTornRouter:(await deployments.get('MTornRouter')).address,
    };
   let  mRootDb =<RootDB> await (await ethers.getContractFactory("RootDB")).attach(contracts.RootManger);

    expect(await mRootDb.exitQueueContract()).equal(contracts.ExitQueue);
    expect(await mRootDb.TORN_CONTRACT()).equal(contracts.mock_torn);
    expect(await mRootDb.TORN_RELAYER_REGISTRY()).equal(contracts.mRelayerRegistry);
    expect(await mRootDb.inComeContract()).equal(contracts.Income);
    expect(await mRootDb.exitQueueContract()).equal(contracts.ExitQueue);
    expect(await mRootDb.depositContract()).equal(contracts.Deposit);

}

export interface USER_FIX {
     owner:SignerWithAddress,proxy_admin:SignerWithAddress;
     deployer1:SignerWithAddress,relayer1:SignerWithAddress;
     relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
     stake1:SignerWithAddress,stake2:SignerWithAddress,stake3:SignerWithAddress;
     dao_relayer1:SignerWithAddress,dao_relayer2:SignerWithAddress,dao_relayer3:SignerWithAddress,reward:SignerWithAddress; owner2:SignerWithAddress
}

export  async function get_user_fixture(){
    let owner2:SignerWithAddress,proxy_admin:SignerWithAddress;
    let deployer1:SignerWithAddress,owner:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress,stake3:SignerWithAddress;
    let dao_relayer1:SignerWithAddress,dao_relayer2:SignerWithAddress,dao_relayer3:SignerWithAddress,reward:SignerWithAddress;
    // @ts-ignore
    [deployer1,owner,proxy_admin,operator,relayer1, relayer2,relayer3,user1,user2,user3,operator,stake1,stake2,stake3,dao_relayer1,dao_relayer2,dao_relayer3,owner2,reward] = await ethers.getSigners();
    return {
        deployer1,owner,proxy_admin,operator,relayer1, relayer2,relayer3,user1,user2,user3,stake1,stake2,stake3,dao_relayer1,dao_relayer2,dao_relayer3,owner2,reward
    };

}



export  async function set_up_fixture(fix_name:string) {
    // it first ensure the deployment is executed and reset (use of evm_snaphost for fast test)
    // await deployments.fixture(["mock_torn"]);
    expect("test_net register_relayers".includes(fix_name)).true;
    await deployments.fixture([fix_name]);
    // we get an instantiated contract in the form of a ethers.js Contract instance:
    const contracts = {
        mock_torn: (await deployments.get('mock_torn')).address,
        mock_dai: (await deployments.get('mock_dai')).address,
        mock_usdc: (await deployments.get('mock_usdc')).address,
        mock_weth: (await deployments.get('mock_weth')).address,
        mTornadoGovernanceStaking:(await deployments.get('MTornadoGovernanceStaking')).address,
        mRelayerRegistry:(await deployments.get('MRelayerRegistry')).address,
        mTornadoStakingRewards:(await deployments.get('MTornadoStakingRewards')).address,
        Deposit:(await deployments.get('Deposit')).address,
        RootManger:(await deployments.get('RootManger')).address,
        ExitQueue:(await deployments.get('ExitQueue')).address,
        Income:(await deployments.get('Income')).address,
        MTornRouter:(await deployments.get('MTornRouter')).address,
        mProfitRecord:(await deployments.get('ProfitRecord')).address,
    };


    let torn_erc20: MERC20;
    let usdc_erc20: MERC20;
    let dai_erc20: MERC20;
    let weth_erc20: MERC20;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    let mRelayerRegistry :MRelayerRegistry;
    let mTornadoStakingRewards :MTornadoStakingRewards;

    let mTornRouter :MTornRouter;
    let mRootDb:RootDB;
    let mDeposit :Deposit;
    let mExitQueue :ExitQueue;
    let mIncome :Income;


    torn_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_torn);
    usdc_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_usdc);
    dai_erc20  = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_dai);
    weth_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_weth);

    mRelayerRegistry = <MRelayerRegistry>(await ethers.getContractFactory("MRelayerRegistry")).attach(contracts.mRelayerRegistry);
    mTornadoStakingRewards = <MTornadoStakingRewards>(await ethers.getContractFactory("MTornadoStakingRewards")).attach(contracts.mTornadoStakingRewards);
    mTornadoGovernanceStaking = <MTornadoGovernanceStaking>(await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(contracts.mTornadoGovernanceStaking);


    mRootDb =<RootDB> await (await ethers.getContractFactory("RootDB")).attach(contracts.RootManger);

    mIncome = <Income> await (await ethers.getContractFactory("Income")).attach(contracts.Income);

    mTornRouter = <MTornRouter> await (await ethers.getContractFactory("MTornRouter")).attach(contracts.MTornRouter);

    mDeposit = <Deposit> await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);

    mExitQueue = <ExitQueue> await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);
    let mProfitRecord:ProfitRecord = <ProfitRecord> await (await ethers.getContractFactory("ProfitRecord")).attach(contracts.mProfitRecord);

    await config_check();
    // finally we return the whole object (including the tokenOwner set_up as a User object)
    return {
        usdc_erc20,
        dai_erc20,
        weth_erc20,
        torn_erc20,mRelayerRegistry,mTornadoStakingRewards,mTornadoGovernanceStaking,mRootDb,mIncome,mTornRouter,mDeposit,mExitQueue,mProfitRecord
    };
}
