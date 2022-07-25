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

    let users: USER_FIX = await get_user_fixture();
    let fix :Fixture = await get_eth_fixture();

    const contracts = {
        mock_torn: address_torn_erc20,
    };

    let ProfitRecord_logic_v3 = await deploy('ProfitRecord_logic_v3', {
        from: users.deployer1.address,
        args: [contracts.mock_torn, fix.mRootDb.address],
        log: true,
        contract: "ProfitRecord"
    });

    await fix.mProfitRecord_proxy.connect(users.proxy_admin).upgradeTo(ProfitRecord_logic_v3.address)
};
export default func;
func.tags = ['profitRecord_logic_v3'];
