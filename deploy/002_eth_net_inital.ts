
import {DeployFunction} from 'hardhat-deploy/types';
import {HardhatRuntimeEnvironment} from "hardhat/types";
import {Deposit, ExitQueue, Income, MTornadoGovernanceStaking, MTornRouter, RootManger} from "../typechain-types";
import {set_up} from "../test/start_up";

import {SignerWithAddress} from "@nomiclabs/hardhat-ethers/src/signers";



const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {

    // @ts-ignore
    const {deployments,ethers} = hre;
    const {deploy} = deployments;

    const contracts = {
        Deposit:(await deployments.get('Deposit')).address,
        RootManger:(await deployments.get('RootManger')).address,
        ExitQueue:(await deployments.get('ExitQueue')).address,
        Income:(await deployments.get('Income')).address,
    };

    let mRootManger:RootManger;
    let mDeposit :Deposit;
    let mExitQueue :ExitQueue;
    let mIncome :Income;


    mRootManger = <RootManger>await (await ethers.getContractFactory("RootManger")).attach(contracts.RootManger);

    mIncome = <Income>await (await ethers.getContractFactory("Income")).attach(contracts.Income);

    mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);

    mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);

    let deployer1:SignerWithAddress,deployer2:SignerWithAddress,relayer1:SignerWithAddress;
    let relayer2:SignerWithAddress,relayer3:SignerWithAddress,user1:SignerWithAddress,user2:SignerWithAddress,user3:SignerWithAddress,operator:SignerWithAddress ;
    let stake1:SignerWithAddress,stake2:SignerWithAddress,stake3:SignerWithAddress;
    // @ts-ignore
    [deployer1,deployer2,relayer1, relayer2,relayer3,user1,user2,user3,operator,stake1,stake2,stake3] = await ethers.getSigners();

    try {
        await mRootManger.connect(deployer2).__RootManger_init(mIncome.address, mDeposit.address, mExitQueue.address);
    } catch (e) {
        // @ts-ignore
        console.log("__RootManger_init fail :",e.reason)
    }

    try {
        let operator_  = await mRootManger.connect(deployer2).operator();
        if(operator_ !== operator.address){
            await mRootManger.connect(deployer2).setOperator(operator.address);
        }
    } catch (e) {
        // @ts-ignore
        console.log("setOperator fail :",e.reason)
    }

    try {
        await mDeposit.connect(deployer2).__Deposit_init();
    } catch (e) {
        // @ts-ignore
        console.log("__Deposit_init fail :",e.reason)
    }

    try {
        await mExitQueue.connect(deployer2).__ExitQueue_init();
    } catch (e) {
        // @ts-ignore
        console.log("__ExitQueue_init fail :",e.reason)
    }




};
export default func;
func.tags = ['deploy_initial'];
func.dependencies = ["deploy_eth"];
