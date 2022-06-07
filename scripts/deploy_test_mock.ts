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
  let mockSwap :MockSwap;




  usdc_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("usdc","mock_usdc",6);
  console.log(`let address_usdc_erc20 = '${usdc_erc20.address}'`);
  dai_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("dai","mock_dai",18);
  console.log(`let address_dai_erc20 = '${dai_erc20.address}'`);
  torn_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("torn","mock_torn",18);
  console.log(`let address_torn_erc20 = '${torn_erc20.address}'`);
  weth_erc20 = await (await ethers.getContractFactory("MERC20")).deploy("weth","mock_weth",18);
  console.log(`let address_weth_erc20 = '${weth_erc20.address}'`);




  mockSwap =  await (await ethers.getContractFactory("MockSwap")).deploy(weth_erc20.address);
  console.log(`let address_mockSwap =  '${mockSwap.address}'`);

  mTornadoGovernanceStaking = await (await ethers.getContractFactory("MTornadoGovernanceStaking")).deploy(torn_erc20.address);
  console.log(`let address_MTornadoGovernanceStaking =  '${mTornadoGovernanceStaking.address}'`);

  mRelayerRegistry = await (await ethers.getContractFactory("MRelayerRegistry")).deploy(mTornadoGovernanceStaking.address,torn_erc20.address);
  console.log(`let address_MRelayerRegistry =  '${mRelayerRegistry.address}'`);

  mTornadoStakingRewards = await (await ethers.getContractFactory("MTornadoStakingRewards")).deploy(mTornadoGovernanceStaking.address,torn_erc20.address);
  console.log(`let address_MTornadoStakingRewards =  '${mTornadoStakingRewards.address}'`);

  await mTornadoGovernanceStaking.setStakingRewardContract(mTornadoStakingRewards.address);
  console.log(`let address_mTornadoGovernanceStaking =  '${mTornadoGovernanceStaking.address}'`);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
