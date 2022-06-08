
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";

import {MTornadoGovernanceStaking} from "../typechain-types";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments,ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;

    const {deployer1} = await getNamedAccounts();
    await deploy('mock_usdc', {
        from: deployer1,
        args: ["usdc","mock_usdc",6],
        log: true,
        contract:"MERC20"
    });


    await deploy('mock_dai', {
        from: deployer1,
        args: ["dai","mock_dai",18],
        log: true,
        contract:"MERC20"
    });

    await deploy('mock_weth', {
        from: deployer1,
        args: ["weth","mock_weth",18],
        log: true,
        contract:"MERC20"
    });

    await deploy('mock_torn', {
        from: deployer1,
        args: ["torn","mock_torn",18],
        log: true,
        contract:"MERC20"
    });

    let addr =  (await deployments.get('mock_weth')).address;

    await deploy('MockSwap', {
        from: deployer1,
        args: [addr],
        log: true,
        contract:"MockSwap"
    });

    let torn_erc20_addr =  (await deployments.get('mock_torn')).address;

   let mTornadoGovernanceStaking_res =  await deploy('MTornadoGovernanceStaking', {
        from: deployer1,
        args: [torn_erc20_addr],
        log: true,
        contract:"MTornadoGovernanceStaking"
    });


   let ret_MRelayerRegistry =  await deploy('MRelayerRegistry', {
        from: deployer1,
        args: [mTornadoGovernanceStaking_res.address,torn_erc20_addr],
        log: true,
        contract:"MRelayerRegistry"
    });


    let ret_mTornadoStakingRewards =  await deploy('MTornadoStakingRewards', {
        from: deployer1,
        args: [mTornadoGovernanceStaking_res.address,torn_erc20_addr],
        log: true,
        contract:"MTornadoStakingRewards"
    });


    if(ret_mTornadoStakingRewards.newlyDeployed){
        let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
        mTornadoGovernanceStaking = <MTornadoGovernanceStaking>(await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(mTornadoGovernanceStaking_res.address);
        await mTornadoGovernanceStaking.setStakingRewardContract(ret_mTornadoStakingRewards.address);
    }








};
export default func;
func.tags = ['mock_token'];
