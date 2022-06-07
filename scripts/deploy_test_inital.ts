// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {
    Deposit, ExitQueue, Income,
    MERC20, MockSwap,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    RootManger
} from "../typechain";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";

const delay = (ms: number) => new Promise((resolve, reject) => setTimeout(resolve, ms))

const waitBlocks = async (block: number) => {

    const network = await ethers.getDefaultProvider().getNetwork();
    console.log("Network name=", network.name);

    const blockNumAfter = await ethers.provider.getBlockNumber();
    while(true){
        let NO = await ethers.provider.getBlockNumber();
        console.log(NO);
        if(NO >= blockNumAfter+block){
            return;
        }else{
            await delay(15000);
        }
    }

}



async function main() {
    let torn_erc20: MERC20;
    let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
    let mRelayerRegistry :MRelayerRegistry;
    let mTornadoStakingRewards :MTornadoStakingRewards;

    let mockSwap :MockSwap;
    let deployer1:SignerWithAddress,deployer2:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress,stake3:SignerWithAddress;



    let address_usdc_erc20 = '0x9F69FE7e06779B8673DA171F04039b671Caf58Cf';
    let address_dai_erc20 = '0xC0147c50f0C027eD25AcA001A62156227c9bB3E7';
    let address_torn_erc20 = '0xaaA49C83CB77D49F187e5F19F6A29bd7bfAc1349';
    let address_weth_erc20 = '0x6DA01485932434c78D3C3A56804C8EbCD80B5524';
    let address_mockSwap =  '0x61972e3016040347e83C2e9a6f30827AF758927F';
    let address_MTornadoGovernanceStaking =  '0x0Aacd406A99FDE9dCFb09dda316b77A6cE15D923';
    let address_MRelayerRegistry =  '0x1CA1C0E6c9649f341086FD54c44e1778CA230817';
    let address_MTornadoStakingRewards =  '0x7D7a35A3E4503b2Cc0f167b1c54CCD279E4FcAcf';
    let address_mTornadoGovernanceStaking =  '0x0Aacd406A99FDE9dCFb09dda316b77A6cE15D923';

    let address_mRootManger_logic =  '0x05De9fd608d5301BED3ccF807127be5B5d6D6EFb';
    let address_mRootManger_proxy =  '0xab9705376a93cD0F15b0a3a0232FbA6989410564';
    let address_mIncome_logic =  '0xB8F413A881fA869caa775f561a4CFf1bD45ee880';
    let address_mIncome_proxy =  '0xE6ec350BF8a0Bce1C0Fcf0e3FF62Cf6Dd52833Fe';
    let address_mTornRouter =  '0x5313c9EE754B0c8EB5D3b6F130F81c6246A87F38';
    let address_mDeposit_logic =  '0x0b4391f95Cabb9e15239e583a19c4d80bD34e22C';
    let address_mDeposit_proxy =  '0x870C44cFea1645C1ce675389ab1E932280403923';
    let address_mExitQueue_logic =  '0x997E633dB3B24819338561cA46EdBEf75D13Cf4b';
    let address_mExitQueue_proxy =  '0xd23984B5B7169222C030e2d8CE08FE820b3ba9C0';


        // @ts-ignore
    [deployer1,deployer2,relayer1, relayer2,relayer3,user1,user2,user3,operator,stake1,stake2,stake3] = await ethers.getSigners();

    torn_erc20 = (await ethers.getContractFactory("MERC20")).attach(address_torn_erc20);
    mockSwap =  (await ethers.getContractFactory("MockSwap")).attach(address_mockSwap);
    mRelayerRegistry = (await ethers.getContractFactory("MRelayerRegistry")).attach(address_MRelayerRegistry);
    mTornadoStakingRewards = (await ethers.getContractFactory("MTornadoStakingRewards")).attach(address_MTornadoStakingRewards);
    mTornadoGovernanceStaking = (await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(address_MTornadoGovernanceStaking);
    await mTornadoGovernanceStaking.setStakingRewardContract(mTornadoStakingRewards.address);

    let proxy_mIncome = await (await ethers.getContractFactory("Income")).attach(address_mIncome_proxy);

    let proxy_Deposit =( await ethers.getContractFactory('Deposit')).attach(address_mDeposit_proxy);
    console.log("await proxy_Deposit.connect(deployer2).__Deposit_init()");
   // await proxy_Deposit.connect(deployer2).__Deposit_init();

    let proxy_ExitQueue = (await ethers.getContractFactory('ExitQueue')).attach(address_mExitQueue_proxy);
    console.log("proxy_ExitQueue.connect(deployer2).__ExitQueue_init()");
   // await proxy_ExitQueue.connect(deployer2).__ExitQueue_init();

    let proxy_RootManger = (await ethers.getContractFactory('RootManger')).attach(address_mRootManger_proxy);
    console.log("__RootManger_init(proxy_mIncome.address,proxy_Deposit.address,proxy_ExitQueue.address)");
  //  await proxy_RootManger.connect(deployer2).__RootManger_init(proxy_mIncome.address,proxy_Deposit.address,proxy_ExitQueue.address);
  //  await proxy_RootManger.connect(deployer2).setOperator(operator.address);

    //give enough torn for swap
    console.log("torn_erc20.mint for: "+mockSwap.address);
    await torn_erc20.mint(mockSwap.address, ethers.utils.parseUnits("1000000",18));

    console.log("torn_erc20.mint for: "+stake1.address);
    let stake_torn=ethers.utils.parseUnits("1",18);
    await torn_erc20.mint(stake1.address,stake_torn);


    //register relayers
    //give torn to relayers
    console.log("torn_erc20.mint for: relayer1.address "+relayer1.address);
    await torn_erc20.mint(relayer1.address, ethers.utils.parseUnits("10000",18));
    console.log("torn_erc20.mint for: relayer2.address "+relayer2.address);
    await torn_erc20.mint(relayer2.address, ethers.utils.parseUnits("10000",18));
    console.log("torn_erc20.mint for: relayer3.address "+relayer3.address);
    await torn_erc20.mint(relayer3.address, ethers.utils.parseUnits("10000",18));

    let stake_value = ethers.utils.parseUnits("5000",18);
    await torn_erc20.connect(relayer1).approve(mRelayerRegistry.address,stake_value);
    console.log("1approve(mRelayerRegistry.address,stake_value)");
    await torn_erc20.connect(relayer2).approve(mRelayerRegistry.address,stake_value);
    console.log("2approve(mRelayerRegistry.address,stake_value)");
    await torn_erc20.connect(relayer1).approve(mTornadoGovernanceStaking.address,stake_torn);
    console.log("3approve(mRelayerRegistry.address,stake_value)");

    await waitBlocks(2);

    //initialize fist stake avoid dive 0


    await mTornadoGovernanceStaking.connect(relayer1).stake(stake_torn)
    await mRelayerRegistry.connect(relayer2).register(relayer2.address,stake_value);
    await mRelayerRegistry.connect(relayer1).register(relayer1.address,stake_value);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
