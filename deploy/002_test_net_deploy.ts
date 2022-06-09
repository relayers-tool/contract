
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {Deposit, ExitQueue, MERC20, MTornadoGovernanceStaking, RootManger} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";



const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments,ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer1,proxy_admin,operator} = await getNamedAccounts();
    let deployer_1:SignerWithAddress,deployer2:SignerWithAddress;
    // @ts-ignore
    [deployer_1,deployer2,] = await ethers.getSigners();
    const contracts = {
        mock_torn: (await deployments.get('mock_torn')).address,
        mock_dai: (await deployments.get('mock_dai')).address,
        mock_usdc: (await deployments.get('mock_usdc')).address,
        mock_weth: (await deployments.get('mock_weth')).address,
        mTornadoGovernanceStaking:(await deployments.get('MTornadoGovernanceStaking')).address,
        mRelayerRegistry:(await deployments.get('MRelayerRegistry')).address,
        mTornadoStakingRewards:(await deployments.get('MTornadoStakingRewards')).address,
        mockSwap:(await deployments.get('MockSwap')).address,
    };

    let ret_RootManger_logic =  await deploy('RootManger_logic', {
        from: deployer1,
        args: [contracts.mRelayerRegistry,contracts.mock_torn],
        log: true,
        contract:"RootManger"
    });

    let ret_RootManger =  await deploy('RootManger', {
        from:deployer1,
        args: [ret_RootManger_logic.address,proxy_admin,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });


    let ret_Income_logic =  await deploy('Income_logic', {
        from: deployer1,
        args: [contracts.mockSwap,contracts.mock_weth,contracts.mock_torn,ret_RootManger.address],
        log: true,
        contract:"Income"
    });


    let ret_mIncome =  await deploy('Income', {
        from: deployer1,
        args: [ret_Income_logic.address,proxy_admin,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });

    let ret_mTornRouter =  await deploy('MTornRouter', {
        from: deployer1,
        args: [contracts.mock_usdc,contracts.mock_dai,ret_mIncome.address,contracts.mRelayerRegistry],
        log: true,
        contract:"MTornRouter"
    });


    let ret_mDeposit_logic =  await deploy('Deposit_logic', {
        from: deployer1,
        args: [contracts.mock_torn,contracts.mTornadoGovernanceStaking,contracts.mRelayerRegistry,ret_RootManger.address],
        log: true,
        contract:"Deposit"
    });


    let ret_Deposit =  await deploy('Deposit', {
        from: deployer1,
        args: [ret_mDeposit_logic.address,proxy_admin,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });


    let ret_mExitQueue_logic =  await deploy('ExitQueue_logic', {
        from: deployer1,
        args: [contracts.mock_torn,ret_RootManger.address],
        log: true,
        contract:"ExitQueue"
    });


    let ret_mExitQueue =  await deploy('ExitQueue', {
        from: deployer1,
        args: [ret_mExitQueue_logic.address,proxy_admin,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });

    if(ret_RootManger.newlyDeployed){
        let mRootManger = <RootManger>await (await ethers.getContractFactory("RootManger")).attach(ret_RootManger.address);
        await mRootManger.connect(deployer2).__RootManger_init(ret_mIncome.address, ret_Deposit.address, ret_mExitQueue.address);
        await mRootManger.connect(deployer2).setOperator(operator);
    }

    if(ret_Deposit.newlyDeployed){
        let  mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(ret_Deposit.address);
        await mDeposit.connect(deployer2).__Deposit_init();
    }

    if(ret_mExitQueue.newlyDeployed){
        let mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(ret_mExitQueue.address);
        await mExitQueue.connect(deployer2).__ExitQueue_init();
    }

    let torn_erc20:MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_torn);
    //give enough torn for swap
    await torn_erc20.mint(contracts.mockSwap, ethers.utils.parseUnits("1000000",18));

};
export default func;
func.tags = ['test_net'];
func.dependencies = ["mock_token"];
