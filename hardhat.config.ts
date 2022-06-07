import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import 'hardhat-deploy';

dotenv.config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("transfer", "transfer eth to 1~3", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  let eth =  await accounts[0].getBalance();
    if(eth.eq(0)){
      console.log("eth is 0 ");
      return;
    }
   eth = eth.div(8);
    let send_to = async ( addr:string) =>{
      console.log("send to ",addr,eth);
        const tx = await accounts[0].sendTransaction({
          to: addr,
          value: eth
        });
        let rep = await hre.ethers.provider.waitForTransaction(tx.hash,1,250000);
        if(!rep.status)
        {
          throw "time out"
        }
    }
  await send_to(accounts[1].address);
  await send_to(accounts[2].address);
  await send_to(accounts[3].address);
  await send_to(accounts[4].address);

});


// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.9",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  namedAccounts: {
    deployer1:0,
    deployer2:1,
    relayer1:2,
    relayer2:3,
    relayer3:4,
    user1:5,
    user2:6,
    user3:7,
    operator:8,
    stake1:9,
    stake2:10,
    stake3:11
  },
  networks: {
    hardhat: {
      accounts:{
        accountsBalance:"100000000000000000000000000"
      }
    },

    matic: {
      url: process.env.RPC_URL,
      chainId: 137,
      accounts: {
        mnemonic:process.env.PRIVATE_MNEMONIC,
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 16
      }
    },

  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config;
