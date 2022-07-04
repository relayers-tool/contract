import {Deposit, ExitQueue, ProfitRecord, RootDB} from "../typechain-types";

import {get_user_fixture, USER_FIX} from "../test/start_up";

const {ethers} = require("hardhat");


async function main() {

    const contracts = {
        Deposit: "0x7155F8c9B74BED0C69d58A730914f2232c5CeE4c",
        RootManger: "0x6201dBf488e977018F4A1BbD8Df57F5327991ECE",
        ExitQueue: "0x859971C83B596e599D1C00254E827d7de90a0562",
        Income: "0xD184DE1fAD8F2D340c7720A3e1D54f5947e010e5",
        profitRecord: "0xb1eB9a41d45b5CDEf4ca8586e05Cc5C001AAEdB8",
    };

    let mRootDb = <RootDB>await (await ethers.getContractFactory("RootDB")).attach(contracts.RootManger);
    let mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);
    let mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);
    let mProfitRecord = <ProfitRecord>await (await ethers.getContractFactory("ProfitRecord")).attach(contracts.profitRecord);
    let users: USER_FIX = await get_user_fixture();


    console.log("__RootManger_init");
    try {
        let tx = await mRootDb.connect(users.owner).__RootDB_init(contracts.Income, contracts.Deposit, contracts.ExitQueue, contracts.profitRecord);
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }


    if ((await mRootDb.operator()) != users.operator.address) {
        try {
            console.log("setOperator")
            let tx = await mRootDb.connect(users.owner).setOperator(users.operator.address);
            await tx.wait(1);
        } catch (e: any) {
            console.log(e.reason)
        }

    }


    try {
        console.log("__Deposit_init");
        let tx = await mDeposit.connect(users.owner).__Deposit_init();
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }


    console.log("__ExitQueue_init");
    try {
        let tx = await mExitQueue.connect(users.owner).__ExitQueue_init();
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }

    console.log("__mProfitRecord_init");
    try {
        let tx = await mProfitRecord.connect(users.owner).__ProfitRecord_init();
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }


}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
    })


