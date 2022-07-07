import {Deposit, ExitQueue, ProfitRecord, RootDB} from "../typechain-types";

import {get_eth_fixture, get_user_fixture, USER_FIX} from "../test/start_up";
import {Fixture} from "../test/utils";

const {ethers} = require("hardhat");


async function main() {

     let fix :Fixture = await get_eth_fixture();
    let users: USER_FIX = await get_user_fixture();


    console.log("__RootDb_init");
    try {
        let tx = await fix.mRootDb.connect(users.owner).__RootDB_init(fix.mIncome.address, fix.mDeposit.address, fix.mExitQueue.address, fix.mProfitRecord.address);
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }


    if ((await fix.mRootDb.operator()) != users.operator.address) {
        try {
            console.log("setOperator")
            let tx = await fix.mRootDb.connect(users.owner).setOperator(users.operator.address);
            await tx.wait(1);
        } catch (e: any) {
            console.log(e.reason)
        }

    }


    try {
        console.log("__Deposit_init");
        let tx = await fix.mDeposit.connect(users.owner).__Deposit_init();
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }


    console.log("__ExitQueue_init");
    try {
        let tx = await fix.mExitQueue.connect(users.owner).__ExitQueue_init();
        await tx.wait(1);
    } catch (e: any) {
        console.log(e.reason)
    }

    console.log("__mProfitRecord_init");
    try {
        let tx = await fix.mProfitRecord.connect(users.owner).__ProfitRecord_init();
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


