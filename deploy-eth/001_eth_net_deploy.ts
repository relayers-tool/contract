import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";

import {Deposit, ExitQueue, Income, RootManger} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {get_user_fixture, USER_FIX} from "../test/start_up";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments,ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;


    let deployer1:SignerWithAddress,deployer2:SignerWithAddress;
    let address_torn_erc20 =  '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C';
    let address_SwapRouter =  '0xE592427A0AEce92De3Edee1F18E0157C05861564';
    let address_TornadoGovernanceStaking =  '0x5efda50f22d34f262c29268506c5fa42cb56a1ce';
    let address_RelayerRegistry =  '0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2';
    let address_TornadoStakingRewards =  '0x2fc93484614a34f26f7970cbb94615ba109bb4bf';
    let address_weth ="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

    const {operator} = await getNamedAccounts();

    let users:USER_FIX = await get_user_fixture();
    deployer1 = users.deployer1;
    deployer2 = users.deployer2;

    let ret_RootManger_logic =  await deploy('RootManger_logic', {
        from: deployer1.address,
        args: [address_RelayerRegistry,address_torn_erc20],
        log: true,
        contract:"RootManger"
    });

    let ret_RootManger =  await deploy('RootManger', {
        from: deployer1.address,
        args: [ret_RootManger_logic.address,deployer1.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });


    let ret_Income_logic =  await deploy('Income_logic', {
        from: deployer1.address,
        args: [address_SwapRouter,address_weth,address_torn_erc20,ret_RootManger.address],
        log: true,
        contract:"Income"
    });

    let ret_mIncome =  await deploy('Income', {
        from: deployer1.address,
        args: [ret_Income_logic.address,deployer1.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });

    let ret_mDeposit_logic =  await deploy('Deposit_logic', {
        from: deployer1.address,
        args: [address_torn_erc20,address_TornadoGovernanceStaking,address_RelayerRegistry,ret_RootManger.address],
        log: true,
        contract:"Deposit"
    });

    let ret_Deposit =  await deploy('Deposit', {
        from: deployer1.address,
        args: [ret_mDeposit_logic.address,deployer1.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });

    let ret_mExitQueue_logic =  await deploy('ExitQueue_logic', {
        from: deployer1.address,
        args: [address_torn_erc20,ret_RootManger.address],
        log: true,
        contract:"ExitQueue"
    });

    let ret_mExitQueue =  await deploy('ExitQueue', {
        from: deployer1.address,
        args: [ret_mExitQueue_logic.address,deployer1.address,"0x"],
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

};
export default func;
func.tags = ['deploy_eth'];
