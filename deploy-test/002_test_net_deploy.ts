
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {MTornadoGovernanceStaking} from "../typechain-types";



const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments,ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer1,proxy_admin} = await getNamedAccounts();

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

};
export default func;
func.tags = ['test_net'];
func.dependencies = ["mock_token"];
