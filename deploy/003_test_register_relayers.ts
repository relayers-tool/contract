import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornRouter,
    RootManger
} from "../typechain-types";
import {get_user_fixture, USER_FIX} from "../test/start_up";
import {BigNumber} from "ethers";

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

    let mRootManger:RootManger;


    let torn_erc20:MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_torn);
    mRootManger = <RootManger>await (await ethers.getContractFactory("RootManger")).attach(contracts.RootManger);



    let users:USER_FIX = await get_user_fixture();
    let deployer2 = users.deployer2;
    let relayer1 = users.relayer1;
    let relayer2 = users.relayer2;
    let relayer3 = users.relayer3;
    let stake1 = users.stake1;
    let dao_relayer1 = users.dao_relayer1;
    let owner = users.owner;

    //register relayers
    //give torn to relayers

    let limit_token = ethers.utils.parseUnits("5000",18);
    if((await torn_erc20.balanceOf(relayer1.address)) < limit_token ){
        (await torn_erc20.mint(relayer1.address, ethers.utils.parseUnits("1000000",18)));
    }
    // console.log("mint for relayer2:",relayer2.address);
    if(await torn_erc20.balanceOf(relayer2.address) <limit_token ){
        (await torn_erc20.mint(relayer2.address, ethers.utils.parseUnits("1000000",18)));
    }

    if(await torn_erc20.balanceOf(relayer3.address) <limit_token ){
        (await torn_erc20.mint(relayer3.address, ethers.utils.parseUnits("1000000",18)));
    }
    if(await torn_erc20.balanceOf(dao_relayer1.address) <limit_token ){
        (await torn_erc20.mint(dao_relayer1.address, ethers.utils.parseUnits("1000000",18)));
    }



    let stake_value = ethers.utils.parseUnits("500",18);

    let mRelayerRegistry = <MRelayerRegistry>(await ethers.getContractFactory("MRelayerRegistry")).attach(contracts.mRelayerRegistry);
    let mTornadoGovernanceStaking = <MTornadoGovernanceStaking>await (await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(contracts.mTornadoGovernanceStaking);

    let allowance = await torn_erc20.connect(relayer1).allowance(relayer1.address,mRelayerRegistry.address);

    if(allowance < stake_value.mul(50)){
        (await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address,stake_value.mul(500)));
    }


    try {
        (await mRelayerRegistry.connect(relayer1).register(relayer1.address, stake_value.mul(10)))
    } catch (e:any) {
        console.log(e.reason)
    }



    allowance = await torn_erc20.connect(relayer2).allowance(relayer2.address,mRelayerRegistry.address);
    if(allowance <stake_value.mul(1000)){
        await (await torn_erc20.connect(relayer2).approve(mRelayerRegistry.address,stake_value.mul(5000))).wait(1);
    }
     try {
        await (await mRelayerRegistry.connect(relayer2).register(relayer2.address, stake_value.mul(10))).wait(1);
    } catch (e:any) {
        console.log(e.reason)
    }


    allowance = await torn_erc20.connect(dao_relayer1).allowance(dao_relayer1.address,mRelayerRegistry.address);
    if(allowance < (stake_value.mul(50))){
        await (await torn_erc20.connect(dao_relayer1).approve(mRelayerRegistry.address,stake_value.mul(600))).wait(1);
    }
     try {
        await (await mRelayerRegistry.connect(dao_relayer1).register(dao_relayer1.address, 0)).wait(1);
    } catch (e:any) {
        console.log(e.reason)
    }


    try {
        await (await mRelayerRegistry.connect(dao_relayer1).register(users.dao_relayer2.address, 0)).wait(1);
    } catch (e:any) {
        console.log(e.reason)
    }


    try {
        await (await mRelayerRegistry.connect(dao_relayer1).register(users.dao_relayer3.address, 0)).wait(1);
    } catch (e:any) {
        console.log(e.reason)
    }


    if((await mRootManger.connect(owner).owner()) != owner.address){
        await (await mRootManger.connect(deployer2).transferOwnership(owner.address)).wait(1);
    }

    let addr = await mRootManger.connect(owner)._relayers(0);
    if(addr != dao_relayer1.address){
        await (await mRootManger.connect(owner).addRelayer(dao_relayer1.address, 0)).wait(1);
    }

    addr = await mRootManger.connect(owner)._relayers(1);
    if(addr != users.dao_relayer2.address){
        await (await mRootManger.connect(owner).addRelayer(users.dao_relayer2.address, 1)).wait(1);
    }

    addr = await mRootManger.connect(owner)._relayers(2);
    if(addr != users.dao_relayer3.address){
        await (await mRootManger.connect(owner).addRelayer(users.dao_relayer3.address, 2)).wait(1);
    }

    addr = await mRootManger.connect(owner)._relayers(1);
    if(addr == users.dao_relayer2.address){
        await (await mRootManger.connect(owner).removeRelayer(1)).wait(1);
    }



    //initialize fist stake avoid dive 0
    let stake_torn=ethers.utils.parseUnits("1",18);

    if((await torn_erc20.balanceOf(stake1.address)).lte(stake_torn.mul(5))){
        await (await torn_erc20.mint(stake1.address,stake_torn.mul(50))).wait(1);
    }

    if((await torn_erc20.allowance(stake1.address,contracts.mTornadoGovernanceStaking)).lte(stake_torn)){
        await (await  torn_erc20.connect(stake1).approve(contracts.mTornadoGovernanceStaking,stake_torn.mul(5))).wait(1);
    }

    if((await mTornadoGovernanceStaking.balanceOf(stake1.address)).lte(stake_torn)){
        await (await  mTornadoGovernanceStaking.connect(stake1).stake(stake_torn)).wait(1);
    }
    // let  mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);
    // await torn_erc20.mint(users.reward.address,stake_torn.mul(100));
    // await torn_erc20.connect(users.reward).approve(mDeposit.address,stake_torn.mul(10))
    // await mDeposit.connect(users.reward).depositWithApproval(stake_torn);

};
export default func;
func.tags = ['register_relayers'];
func.dependencies = ["test_net"];
