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
import {waitBlocks} from "../test/utils";





async function main() {

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


  let address_mRootManger_proxy =  '0xab9705376a93cD0F15b0a3a0232FbA6989410564';
  let address_mIncome_proxy =  '0xE6ec350BF8a0Bce1C0Fcf0e3FF62Cf6Dd52833Fe';
  let address_mTornRouter =  '0x5313c9EE754B0c8EB5D3b6F130F81c6246A87F38';
  let address_mDeposit_proxy =  '0x870C44cFea1645C1ce675389ab1E932280403923';
  let address_mExitQueue_proxy =  '0xd23984B5B7169222C030e2d8CE08FE820b3ba9C0';

      // @ts-ignore
  [deployer1,deployer2,] = await ethers.getSigners();

  const dao_Proxy = await ethers.getContractFactory("RelayerDAOProxy");


  //migrate RootManger
  console.log(`migrate RootManger`);
  const RootManger_Proxy = dao_Proxy.attach(address_mRootManger_proxy);
  let mRootManger_logic = await (await ethers.getContractFactory("RootManger")).deploy(address_MRelayerRegistry,address_torn_erc20);
  console.log(`let address_mRootManger_logic =  '${mRootManger_logic.address}'`);
  await waitBlocks(2);
  let tx =  await RootManger_Proxy.connect(deployer1).upgradeTo(mRootManger_logic.address);
  await  tx.wait();


  //migrate InCome
  console.log(`migrate InCome`);
  const InCome_Proxy = dao_Proxy.attach(address_mIncome_proxy);
  let mIncome_logic= await (await ethers.getContractFactory("Income")).deploy(address_mockSwap,address_weth_erc20,address_torn_erc20,address_mRootManger_proxy);
  console.log(`let address_mIncome_logic =  '${mIncome_logic.address}'`);
  await waitBlocks(2);
  let tx2 =  await InCome_Proxy.connect(deployer1).upgradeTo(mIncome_logic.address);
  await  tx2.wait();

  //migrate mDeposit
  console.log(`migrate Deposit`);
  const Deposit_Proxy = dao_Proxy.attach(address_mDeposit_proxy);
  let mDeposit_logic= await (await ethers.getContractFactory("Deposit")).deploy(address_torn_erc20,address_MTornadoGovernanceStaking,address_MRelayerRegistry,address_mRootManger_proxy);
  console.log(`let address_mDeposit_logic =  '${mDeposit_logic.address}'`);
  await waitBlocks(2);
  let tx3 =  await Deposit_Proxy.connect(deployer1).upgradeTo(mDeposit_logic.address);
  await  tx3.wait();

  //migrate mExitQueue
  console.log(`migrate ExitQueue`);
  const mExitQueue_Proxy = dao_Proxy.attach(address_mExitQueue_proxy);
  let mExitQueue_logic= await (await ethers.getContractFactory("ExitQueue")).deploy(address_torn_erc20,address_mRootManger_proxy);
  console.log(`let address_mExitQueue_logic =  '${mExitQueue_logic.address}'`);
  await waitBlocks(2);
  let tx4 =  await mExitQueue_Proxy.connect(deployer1).upgradeTo(mExitQueue_logic.address);
  await  tx4.wait();

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
