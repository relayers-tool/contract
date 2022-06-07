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
  let usdc_erc20: MERC20,dai_erc20: MERC20,torn_erc20: MERC20,weth_erc20: MERC20;
  let mTornadoGovernanceStaking:MTornadoGovernanceStaking;
  let mRelayerRegistry :MRelayerRegistry;
  let mTornadoStakingRewards :MTornadoStakingRewards;

  let mTornRouter :MTornRouter;
  let mRootManger:RootManger;
  let mDeposit :Deposit;
  let mExitQueue :ExitQueue;
  let mIncome :Income;
  let mockSwap :MockSwap;
  let deployer1:SignerWithAddress,deployer2:SignerWithAddress;



  let address_usdc_erc20 = '0x9F69FE7e06779B8673DA171F04039b671Caf58Cf';
  let address_dai_erc20 = '0xC0147c50f0C027eD25AcA001A62156227c9bB3E7';
  let address_torn_erc20 = '0xaaA49C83CB77D49F187e5F19F6A29bd7bfAc1349';
  let address_weth_erc20 = '0x6DA01485932434c78D3C3A56804C8EbCD80B5524';
  let address_mockSwap =  '0x61972e3016040347e83C2e9a6f30827AF758927F';
  let address_MTornadoGovernanceStaking =  '0x0Aacd406A99FDE9dCFb09dda316b77A6cE15D923';
  let address_MRelayerRegistry =  '0x1CA1C0E6c9649f341086FD54c44e1778CA230817';
  let address_MTornadoStakingRewards =  '0x7D7a35A3E4503b2Cc0f167b1c54CCD279E4FcAcf';
  let address_mTornadoGovernanceStaking =  '0x0Aacd406A99FDE9dCFb09dda316b77A6cE15D923';




      // @ts-ignore
  [deployer1,deployer2,] = await ethers.getSigners();
  usdc_erc20 =(await ethers.getContractFactory("MERC20")).attach(address_usdc_erc20);
  dai_erc20 = (await ethers.getContractFactory("MERC20")).attach(address_dai_erc20);
  torn_erc20 = (await ethers.getContractFactory("MERC20")).attach(address_torn_erc20);
  weth_erc20 = (await ethers.getContractFactory("MERC20")).attach(address_weth_erc20);

  mockSwap =  (await ethers.getContractFactory("MockSwap")).attach(address_mockSwap);
  mTornadoGovernanceStaking = (await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(address_MTornadoGovernanceStaking);
  mRelayerRegistry = (await ethers.getContractFactory("MRelayerRegistry")).attach(address_MRelayerRegistry);
  mTornadoStakingRewards = (await ethers.getContractFactory("MTornadoStakingRewards")).attach(address_MTornadoStakingRewards);

  mRootManger = await (await ethers.getContractFactory("RootManger")).deploy(mRelayerRegistry.address,torn_erc20.address);
  console.log(`let address_mRootManger_logic =  '${mRootManger.address}'`);

  await waitBlocks(2);

  let mRootManger_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mRootManger.address,deployer1.address,"0x");
  console.log(`let address_mRootManger_proxy =  '${mRootManger_proxy.address}'`);

  mIncome = await (await ethers.getContractFactory("Income")).deploy(mockSwap.address,weth_erc20.address,torn_erc20.address,mRootManger.address);
  console.log(`let address_mIncome_logic =  '${mIncome.address}'`);
  await waitBlocks(2);

  let mIncome_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mIncome.address,deployer1.address,"0x");
  console.log(`let address_mIncome_proxy =  '${mIncome_proxy.address}'`);


  mTornRouter = await (await ethers.getContractFactory("MTornRouter")).deploy(usdc_erc20.address,dai_erc20.address,mIncome.address,mRelayerRegistry.address);
  console.log(`let address_mTornRouter =  '${mTornRouter.address}'`);

  mDeposit = await (await ethers.getContractFactory("Deposit")).deploy(torn_erc20.address,mTornadoGovernanceStaking.address,mRelayerRegistry.address,mRootManger.address);
  console.log(`let address_mDeposit_logic =  '${mDeposit.address}'`);
  await waitBlocks(2);
  let mDeposit_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mDeposit.address,deployer1.address,"0x");
  console.log(`let address_mDeposit_proxy =  '${mDeposit_proxy.address}'`);

  mExitQueue = await (await ethers.getContractFactory("ExitQueue")).deploy(torn_erc20.address,mRootManger.address);
  console.log(`let address_mExitQueue_logic =  '${mExitQueue.address}'`);
  await waitBlocks(2);

  let mExitQueue_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mExitQueue.address,deployer1.address,"0x");
  console.log(`let address_mExitQueue_proxy =  '${mExitQueue_proxy.address}'`);


}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
