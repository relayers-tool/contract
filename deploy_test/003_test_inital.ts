
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {
    Deposit,
    ExitQueue,
    Income,
    MERC20, MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornRouter,
    RootManger
} from "../typechain-types";

import {SignerWithAddress} from "hardhat-deploy-ethers/signers";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {


    // @ts-ignore
    const {deployments,ethers} = hre;
    const {deploy} = deployments;

    const contracts = {
        mock_torn: (await deployments.get('mock_torn')).address,
        mock_dai: (await deployments.get('mock_dai')).address,
        mock_usdc: (await deployments.get('mock_usdc')).address,
        mock_weth: (await deployments.get('mock_weth')).address,
        mTornadoGovernanceStaking:(await deployments.get('MTornadoGovernanceStaking')).address,
        mRelayerRegistry:(await deployments.get('MRelayerRegistry')).address,
        mTornadoStakingRewards:(await deployments.get('MTornadoStakingRewards')).address,
        mockSwap:(await deployments.get('MockSwap')).address,
        Deposit:(await deployments.get('Deposit')).address,
        RootManger:(await deployments.get('RootManger')).address,
        ExitQueue:(await deployments.get('ExitQueue')).address,
        Income:(await deployments.get('Income')).address,
        MTornRouter:(await deployments.get('MTornRouter')).address,
    };

    let mTornRouter :MTornRouter;
    let mRootManger:RootManger;
    let mDeposit :Deposit;
    let mExitQueue :ExitQueue;
    let mIncome :Income;

    let torn_erc20:MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_torn);
    mRootManger = <RootManger>await (await ethers.getContractFactory("RootManger")).attach(contracts.RootManger);

    mIncome = <Income>await (await ethers.getContractFactory("Income")).attach(contracts.Income);

    mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);

    mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);

    let owner:SignerWithAddress;
    let deployer1:SignerWithAddress,deployer2:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress,stake3:SignerWithAddress;
    let dao_relayer1:SignerWithAddress,dao_relayer2:SignerWithAddress,dao_relayer3:SignerWithAddress;

    // @ts-ignore
    [deployer1,deployer2,relayer1, relayer2,relayer3,user1,user2,user3,operator,stake1,stake2,stake3,dao_relayer1,dao_relayer2,dao_relayer3,owner] = await ethers.getSigners();
    try {
        await mRootManger.connect(deployer2).__RootManger_init(mIncome.address, mDeposit.address, mExitQueue.address);
    } catch (e) {
        // @ts-ignore
        console.log("__RootManger_init fail :",e.reason)
    }

    try {
        let operator_  = await mRootManger.connect(deployer2).operator();
        if(operator_ !== operator.address){
            await mRootManger.connect(deployer2).setOperator(operator.address);
        }
    } catch (e) {
        // @ts-ignore
        console.log("setOperator fail :",e.reason)
    }

    try {
        await mDeposit.connect(deployer2).__Deposit_init();
    } catch (e) {
        // @ts-ignore
        console.log("__Deposit_init fail :",e.reason)
    }

    try {
        await mExitQueue.connect(deployer2).__ExitQueue_init();
    } catch (e) {
        // @ts-ignore
        console.log("__ExitQueue_init fail :",e.reason)
    }

    //give enough torn for swap
    await torn_erc20.mint(contracts.mockSwap, ethers.utils.parseUnits("1000000",18));

    //register relayers
    //give torn to relayers
    console.log("mint for relayer1 :",relayer1.address);
    await (await torn_erc20.mint(relayer1.address, ethers.utils.parseUnits("10000",18))).wait(1);
    console.log("mint for relayer2:",relayer2.address);
    await (await torn_erc20.mint(relayer2.address, ethers.utils.parseUnits("10000",18))).wait(1);
    console.log("mint for relayer3:",relayer3.address);
    await (await torn_erc20.mint(relayer3.address, ethers.utils.parseUnits("10000",18))).wait(1);

    let stake_value = ethers.utils.parseUnits("5000",18);
     await (await torn_erc20.connect(relayer1).approve(contracts.mRelayerRegistry,stake_value.mul(5))).wait(1);

    let mRelayerRegistry = <MRelayerRegistry>(await ethers.getContractFactory("MRelayerRegistry")).attach(contracts.mRelayerRegistry);
    let mTornadoGovernanceStaking = <MTornadoGovernanceStaking>await (await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(contracts.mTornadoGovernanceStaking);

    console.log("register 1");
    await (await mRelayerRegistry.connect(relayer1).register(relayer1.address, stake_value)).wait(1);
    console.log("register 2");
    await (await torn_erc20.connect(relayer2).approve(mRelayerRegistry.address,stake_value)).wait(1);
    console.log("register 3");
    await (await mRelayerRegistry.connect(relayer2).register(relayer2.address, stake_value)).wait(1);
     console.log("dao_relayer1",dao_relayer1.address);
    await (await torn_erc20.connect(dao_relayer1).approve(mRelayerRegistry.address,stake_value)).wait(1);
    console.log("register 5");
    await (await mRelayerRegistry.connect(dao_relayer1).register(dao_relayer1.address,0)).wait(1);

    try {
        await mRootManger.connect(deployer2).transferOwnership(owner.address);
    } catch (e) {
        // @ts-ignore
        console.log("transferOwnership fail :",e.reason)
    }
    console.log("owner",owner.address);
    let addr = await mRootManger.connect(owner)._relayers(0);
    if(addr != dao_relayer1.address){
         console.log("register :",dao_relayer1.address);
        await (await mRootManger.connect(owner).addRelayer(dao_relayer1.address, 0)).wait(1);
    }

    //initialize fist stake avoid dive 0
    let stake_torn=ethers.utils.parseUnits("1",18);
    await (await torn_erc20.mint(stake1.address,stake_torn)).wait(1);
    await (await  torn_erc20.connect(stake1).approve(contracts.mTornadoGovernanceStaking,stake_torn)).wait(1);
    await (await  mTornadoGovernanceStaking.connect(stake1).stake(stake_torn)).wait(1);

};
export default func;
func.tags = ['test_initial'];
func.dependencies = ["test_net"];
