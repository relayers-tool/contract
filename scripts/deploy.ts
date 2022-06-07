// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import {Deposit, ExitQueue, Income, MERC20, RootManger} from "../typechain";
import {waitBlocks} from "../test/utils";
import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";

async function main() {
  let mRootManger:RootManger;
  let mDeposit :Deposit;
  let mExitQueue :ExitQueue;
  let mIncome :Income;
  let torn_erc20: MERC20;
  let deployer1:SignerWithAddress,deployer2:SignerWithAddress;
  let address_torn_erc20 =  '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C';
  let address_SwapRouter =  '0xE592427A0AEce92De3Edee1F18E0157C05861564';
  let address_TornadoGovernanceStaking =  '0x5efda50f22d34f262c29268506c5fa42cb56a1ce';
  let address_RelayerRegistry =  '0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2';
  let address_TornadoStakingRewards =  '0x2fc93484614a34f26f7970cbb94615ba109bb4bf';
   let address_weth ="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  // @ts-ignore
  [deployer1,deployer2,] = await ethers.getSigners();

  mRootManger = await (await ethers.getContractFactory("RootManger")).deploy(address_RelayerRegistry,address_torn_erc20);
  console.log(`let address_mRootManger_logic =  '${mRootManger.address}'`);
  await waitBlocks(2);


  let mRootManger_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mRootManger.address,deployer1.address,"0x");
  console.log(`let address_mRootManger_proxy =  '${mRootManger_proxy.address}'`);

  mIncome = await (await ethers.getContractFactory("Income")).deploy(address_SwapRouter,address_weth,address_torn_erc20,mRootManger.address);
  console.log(`let address_mIncome_logic =  '${mIncome.address}'`);
  await waitBlocks(2);

  let mIncome_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mIncome.address,deployer1.address,"0x");
  console.log(`let address_mIncome_proxy =  '${mIncome_proxy.address}'`);


  mDeposit = await (await ethers.getContractFactory("Deposit")).deploy(address_torn_erc20,address_TornadoGovernanceStaking,address_RelayerRegistry,mRootManger_proxy.address);
  console.log(`let address_mDeposit_logic =  '${mDeposit.address}'`);
  await waitBlocks(2);
  let mDeposit_proxy = await (await ethers.getContractFactory("RelayerDAOProxy")).deploy(mDeposit.address,deployer1.address,"0x");
  console.log(`let address_mDeposit_proxy =  '${mDeposit_proxy.address}'`);

  mExitQueue = await (await ethers.getContractFactory("ExitQueue")).deploy(address_torn_erc20,mDeposit_proxy.address);
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
