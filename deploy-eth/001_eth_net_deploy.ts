import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";

import {Deposit, ExitQueue, Income, ProfitRecord, RootDB} from "../typechain-types";
import {get_user_fixture, USER_FIX} from "../test/start_up";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments, ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;


    let address_torn_erc20 = '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C';
    let address_TornadoGovernanceStaking = '0x5efda50f22d34f262c29268506c5fa42cb56a1ce';
    let address_RelayerRegistry = '0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2';

    let users: USER_FIX = await get_user_fixture();


    const contracts = {
        mock_torn: address_torn_erc20,
        mTornadoGovernanceStaking: address_TornadoGovernanceStaking,
        mRelayerRegistry: address_RelayerRegistry,
    };

    let ret_RootDb_logic = await deploy('RootDb_logic', {
        from: users.deployer1.address,
        args: [contracts.mRelayerRegistry, contracts.mock_torn],
        log: true,
        contract: "RootDB"
    });

    let ret_RootDb = await deploy('RootDb', {
        from: users.deployer1.address,
        args: [ret_RootDb_logic.address, users.proxy_admin.address, "0x"],
        log: true,
        contract: "RelayerDAOProxy"
    });


    let ret_Income_logic = await deploy('Income_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn, ret_RootDb.address],
        log: true,
        contract: "Income"
    });


    let ret_mIncome = await deploy('Income', {
        from: users.deployer1.address,
        args: [ret_Income_logic.address, users.proxy_admin.address, "0x"],
        log: true,
        contract: "RelayerDAOProxy"
    });


    let ret_mDeposit_logic = await deploy('Deposit_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn, contracts.mTornadoGovernanceStaking, contracts.mRelayerRegistry, ret_RootDb.address],
        log: true,
        contract: "Deposit"
    });


    let ret_Deposit = await deploy('Deposit', {
        from: users.deployer1.address,
        args: [ret_mDeposit_logic.address, users.proxy_admin.address, "0x"],
        log: true,
        contract: "RelayerDAOProxy"
    });


    let ret_ProfitRecord_logic = await deploy('ProfitRecord_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn, ret_RootDb.address],
        log: true,
        contract: "ProfitRecord"
    });

    let ret_ProfitRecord = await deploy('ProfitRecord', {
        from: users.deployer1.address,
        args: [ret_ProfitRecord_logic.address, users.proxy_admin.address, "0x"],
        log: true,
        contract: "RelayerDAOProxy"
    });


    let ret_mExitQueue_logic = await deploy('ExitQueue_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn, ret_RootDb.address],
        log: true,
        contract: "ExitQueue"
    });


    let ret_mExitQueue = await deploy('ExitQueue', {
        from: users.deployer1.address,
        args: [ret_mExitQueue_logic.address, users.proxy_admin.address, "0x"],
        log: true,
        contract: "RelayerDAOProxy"
    });

};
export default func;
func.tags = ['deploy_eth'];
