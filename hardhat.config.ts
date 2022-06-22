import * as dotenv from "dotenv";

import {HardhatUserConfig, task} from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "solidity-coverage";
import 'hardhat-deploy';


dotenv.config();
//
// // This is a sample Hardhat task. To learn how to create your own go to
// // https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();
  for (const account of accounts) {
    console.log(account.address);
  }
});


//task("eth_net_deploy_check", "Prints the list of accounts", eth_net_deploy_check);

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
    owner:1,
    proxy_admin:2,
    relayer1:3,
    relayer2:4,
    relayer3:5,
    user1:6,
    user2:7,
    user3:8,
    operator:9,
    stake1:10,
    stake2:11,
    stake3:12,
    dao_relayer1:13,
    dao_relayer2:14,
    dao_relayer3:15,
    owner2:16,
    reward:17,


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
      gasMultiplier:1.5,
      accounts: {
        mnemonic:process.env.PRIVATE_MNEMONIC?process.env.PRIVATE_MNEMONIC:"test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 18
      }
    },

    bsc: {
      url: process.env.BSC_RPC_URL,
      chainId: 56,
      gasMultiplier:1.3,
      accounts: {
        mnemonic:process.env.PRIVATE_MNEMONIC?process.env.PRIVATE_MNEMONIC:"test test test test test test test test test test test junk",
        path: "m/44'/60'/0'/0",
        initialIndex: 0,
        count: 18
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
