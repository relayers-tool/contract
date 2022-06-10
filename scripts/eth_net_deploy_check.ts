import {Deposit, ExitQueue, RootManger} from "../typechain-types";

import {get_user_fixture, USER_FIX} from "../test/start_up";

const { ethers } = require("hardhat");


async function main() {

    const contracts = {
        Deposit:"",
        RootManger:"",
        ExitQueue:"",
        Income:"",
    };

    let mRootManger = <RootManger>await (await ethers.getContractFactory("RootManger")).attach(contracts.RootManger);
    let  mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);
    let mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);

    let users:USER_FIX = await get_user_fixture();


    if((await mRootManger.connect(users.owner).owner()) != users.owner.address){
        console.log("__RootManger_init");
        await mRootManger.connect(users.owner).__RootManger_init(contracts.Income, contracts.Deposit, contracts.ExitQueue);
        await mRootManger.connect(users.owner).setOperator(users.operator.address);
    }

    if((await mDeposit.connect(users.owner).EXIT_QUEUE()) != contracts.ExitQueue){
        console.log("__Deposit_init");
        await mDeposit.connect(users.owner).__Deposit_init();
    }

    //there is no way to detect init
    try {
        console.log("__ExitQueue_init");
        await mExitQueue.connect(users.owner).__ExitQueue_init();
    } catch (e:any) {
        console.log(e.reason);
    }
}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
    })


