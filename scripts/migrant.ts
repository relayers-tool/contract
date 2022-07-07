import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    RelayerDAOProxy,
    RootDB
} from "../typechain-types";

import {get_eth_fixture, get_user_fixture, USER_FIX} from "../test/start_up";
import {Fixture} from "../test/utils";

const {ethers} = require("hardhat");


async function main() {

    let fix :Fixture = await get_eth_fixture();
    let users: USER_FIX = await get_user_fixture();

    // let stake_torn = ethers.utils.parseUnits( "300", 18);
    console.log(users.reward.address);
    //  await fix.mDeposit.connect(users.operator).depositIni(users.reward.address,stake_torn);
    // await fix.mRootDb.connect(users.owner).addRelayer("0xa0109274F53609f6Be97ec5f3052C659AB80f012",0);

    // let ExitQueue_logic = await (await ethers.getContractFactory("Deposit")).deploy(contracts.tornToken,contracts.Deposit);
    // await ExitQueue_logic.deployed();
    // console.log("ExitQueue_logic.address",ExitQueue_logic.address)
    // await mExitQueue_proxy.connect(users.proxy_admin).upgradeTo(ExitQueue_logic.address);
    //  console.log("upgradeTo(ExitQueue_logic.address)")
    // await mExitQueue.connect(users.operator).migrant();
    //  console.log("migrant")

}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
    })


