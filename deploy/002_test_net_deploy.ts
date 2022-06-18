import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {Deposit, ExitQueue, MERC20, MTornadoGovernanceStaking, RootManger} from "../typechain-types";
import {get_user_fixture, USER_FIX} from "../test/start_up";


const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    // @ts-ignore
    const {deployments,ethers, getNamedAccounts} = hre;
    const {deploy} = deployments;
    let users:USER_FIX = await get_user_fixture();

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
        from: users.deployer1.address,
        args: [contracts.mRelayerRegistry,contracts.mock_torn],
        log: true,
        contract:"RootManger"
    });

    let ret_RootManger =  await deploy('RootManger', {
        from: users.deployer1.address,
        args: [ret_RootManger_logic.address,users.proxy_admin.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });


    let ret_Income_logic =  await deploy('Income_logic', {
        from: users.deployer1.address,
        args: [contracts.mockSwap,contracts.mock_weth,contracts.mock_torn,ret_RootManger.address],
        log: true,
        contract:"Income"
    });


    let ret_mIncome =  await deploy('Income', {
        from: users.deployer1.address,
        args: [ret_Income_logic.address,users.proxy_admin.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });

    let ret_mTornRouter =  await deploy('MTornRouter', {
        from: users.deployer1.address,
        args: [contracts.mock_usdc,contracts.mock_dai,ret_mIncome.address,contracts.mRelayerRegistry],
        log: true,
        contract:"MTornRouter"
    });


    let ret_mDeposit_logic =  await deploy('Deposit_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn,contracts.mTornadoGovernanceStaking,contracts.mRelayerRegistry,ret_RootManger.address],
        log: true,
        contract:"Deposit"
    });


    let ret_Deposit =  await deploy('Deposit', {
        from: users.deployer1.address,
        args: [ret_mDeposit_logic.address,users.proxy_admin.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });


    let ret_ProfitRecord_logic =  await deploy('ProfitRecord_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn,ret_RootManger.address],
        log: true,
        contract:"ProfitRecord"
    });

    let ret_ProfitRecord =  await deploy('ProfitRecord', {
        from: users.deployer1.address,
        args: [ret_ProfitRecord_logic.address,users.proxy_admin.address,"0x"],
        log: true,
        contract:"ProfitRecord"
    });



    let ret_mExitQueue_logic =  await deploy('ExitQueue_logic', {
        from: users.deployer1.address,
        args: [contracts.mock_torn,ret_RootManger.address],
        log: true,
        contract:"ExitQueue"
    });


    let ret_mExitQueue =  await deploy('ExitQueue', {
        from: users.deployer1.address,
        args: [ret_mExitQueue_logic.address,users.proxy_admin.address,"0x"],
        log: true,
        contract:"RelayerDAOProxy"
    });



    let mRootManger = <RootManger>await (await ethers.getContractFactory("RootManger")).attach(ret_RootManger.address);
    let  mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(ret_Deposit.address);
    let mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(ret_mExitQueue.address);

    let torn_erc20:MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_torn);
    //give enough torn for swap

    if(await torn_erc20.balanceOf(contracts.mockSwap) < ethers.utils.parseUnits("100000",18)){
        await torn_erc20.mint(contracts.mockSwap, ethers.utils.parseUnits("1000000",18));
    }


    try {
        await mRootManger.connect(users.owner).__RootManger_init(ret_mIncome.address, ret_Deposit.address, ret_mExitQueue.address);
        await mRootManger.connect(users.owner).setOperator(users.operator.address);
    }
    catch (e:any) {
        console.log(e.reason)
    }


    try {
        await mDeposit.connect(users.owner).__Deposit_init();
    } catch (e:any) {
        console.log(e.reason)
    }


    //there is no way to detect init
    try {
        await mExitQueue.connect(users.owner).__ExitQueue_init();
    } catch (e:any) {
        console.log(e.reason);
    }

    //give enough torn for swap
    if((await torn_erc20.balanceOf(contracts.mockSwap)).lte(ethers.utils.parseUnits("500000",18)))
    {
        await torn_erc20.mint(contracts.mockSwap, ethers.utils.parseUnits("1000000",18));
    }



};
export default func;
func.tags = ['test_net'];
func.dependencies = ["mock_token"];
