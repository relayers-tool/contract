import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";

import {Deposit, ExitQueue, Income, ProfitRecord, RootDB} from "../typechain-types";
import {get_eth_fixture, get_user_fixture, USER_FIX} from "../test/start_up";
import {Fixture} from "../test/utils";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments} = hre;
    const {deploy} = deployments;


    let address_torn_erc20 = '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C';
    let address_TornadoGovernanceStaking = '0x5efda50f22d34f262c29268506c5fa42cb56a1ce';
    let address_RelayerRegistry = '0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2';

    let users: USER_FIX = await get_user_fixture();
    let fix :Fixture = await get_eth_fixture();

    const contracts = {
        mock_torn: address_torn_erc20,
        mTornadoGovernanceStaking: address_TornadoGovernanceStaking,
        mRelayerRegistry: address_RelayerRegistry,
    };

    let ret_Income_logic_v3 = await deploy('ret_Income_logic_v3', {
        from: users.deployer1.address,
        args: [contracts.mock_torn, fix.mRootDb.address],
        log: true,
        contract: "Income"
    });

    await fix.mIncome_proxy.connect(users.proxy_admin).upgradeTo(ret_Income_logic_v3.address)
};
export default func;
func.tags = ['ret_Income_logic_v3'];
