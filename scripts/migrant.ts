import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    RelayerDAOProxy,
    RootDB
} from "../typechain-types";

import {get_user_fixture, USER_FIX} from "../test/start_up";

const {ethers} = require("hardhat");


async function main() {

    // const contracts = {
    //     Deposit:"0xD74284c112C48dc678E7924CdbB22abc487aF1E7",
    //     RootManger:"0x137f2bf9584dE69371624b38bc04fA3c060Cdb29",
    //     ExitQueue:"0x46892dbc480287C2f4BacFb69d9f5d98CCaFA284",
    //     Income:"0x7E3e92d5D6a7bd59a71E4e4d37F109CD80f23b23",
    //     tornToken: '0x3FFe033d7fd8f1A2FE006E59F1F384740Fa54dB6',
    //
    //   RootManger_logic:"0x9A6a66b4f281D2959Daf1fC4CCDF97D4b08FeB63",
    //   Income_logic:"0x6B993008DC453De6E3Eec06E9Fe610efc22a4D59",
    //   Deposit_logic: "0xF00e2088221B4c5D952399324eFa31eeA436f32A",
    //   ExitQueue_logic: "0x9f3c02574FC8EBA30ACEEAd5D26F8B08383A0060",
    //   mRelayerRegistry:"0x6b5aA2bA2e6d3D556a06c67D756aD881B73071f6"
    //
    //
    // };

// bsc
    const contracts = {
        // Deposit:"0xD74284c112C48dc678E7924CdbB22abc487aF1E7",
        // RootManger:"0x137f2bf9584dE69371624b38bc04fA3c060Cdb29",
        // ExitQueue:"0x46892dbc480287C2f4BacFb69d9f5d98CCaFA284",
        // Income:"0x7E3e92d5D6a7bd59a71E4e4d37F109CD80f23b23",
        // tornToken: '0x3FFe033d7fd8f1A2FE006E59F1F384740Fa54dB6',
        //
        // RootManger_logic:"0x9A6a66b4f281D2959Daf1fC4CCDF97D4b08FeB63",
        // Income_logic:"0x6B993008DC453De6E3Eec06E9Fe610efc22a4D59",
        // Deposit_logic: "0xF00e2088221B4c5D952399324eFa31eeA436f32A",
        // ExitQueue_logic: "0x9f3c02574FC8EBA30ACEEAd5D26F8B08383A0060",
        // mRelayerRegistry:"0x6b5aA2bA2e6d3D556a06c67D756aD881B73071f6",

        // usdcToken: '0x0Aacd406A99FDE9dCFb09dda316b77A6cE15D923',
        // daiToken: '0x1CA1C0E6c9649f341086FD54c44e1778CA230817',
        // wethToken: '0x7D7a35A3E4503b2Cc0f167b1c54CCD279E4FcAcf',
        tornToken: '0xC43878E042EEf355eF92b44D322Db9b224F0A1DB',
        RootManger: '0x870C44cFea1645C1ce675389ab1E932280403923',
        Income: '0xd23984B5B7169222C030e2d8CE08FE820b3ba9C0',
        Deposit: '0x3F3d5c45d0bf31FAaB7ed2b0c6F1E0929F38d252',
        ExitQueue: '0xb56699Aadf509A4B3bc9141777B51e6B61741ED2',

        mRelayerRegistry: '0xB8F413A881fA869caa775f561a4CFf1bD45ee880',

        mTornadoGovernanceStaking: "0xab9705376a93cD0F15b0a3a0232FbA6989410564",
        mTornadoStakingRewards: "0xE6ec350BF8a0Bce1C0Fcf0e3FF62Cf6Dd52833Fe",
        TornRouter: "0xd9E93811d472b7060AF9C987c8CAaa0CfC1F58A3",
        usdc: "0x0Aacd406A99FDE9dCFb09dda316b77A6cE15D923",
        dai: "0x1CA1C0E6c9649f341086FD54c44e1778CA230817",

        relayerList: [
            "0xbeaBbbC2C29cA1c9827D6B27a02fbE9a5950B72f",
            "0x4e53D5df704dAA7538cB1Ce3B3E02c5Ec8B6c3A2",
            "0x4Fa92d4b87Ccf0579def9643A2B8BEA4172D3a59",
        ]
    };

    let mRootDb = <RootDB>await (await ethers.getContractFactory("RootDB")).attach(contracts.RootManger);
    let mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);
    let mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);
    let mIncome = <Income>await (await ethers.getContractFactory("Income")).attach(contracts.Income);
    let torn_erc20: MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.tornToken);
    let mTornadoGovernanceStaking = <MTornadoGovernanceStaking>await (await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(contracts.mTornadoGovernanceStaking);
    let mTornadoStakingRewards = <MTornadoStakingRewards>await (await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(contracts.mTornadoStakingRewards);
    let mTornRouter = <MTornRouter>await (await ethers.getContractFactory("MTornRouter")).attach(contracts.TornRouter);
    let usdc_erc20: MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.usdc);
    let dai_erc20: MERC20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.dai);

    let mRelayerRegistry: MRelayerRegistry = <MRelayerRegistry>(await ethers.getContractFactory("MRelayerRegistry")).attach(contracts.mRelayerRegistry);


    let mDeposit_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.Deposit);
    let mExitQueue_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.ExitQueue);
    let mRootDb_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.RootManger);
    let Income_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.Income);

    let users: USER_FIX = await get_user_fixture();

    // let ExitQueue_logic = await (await ethers.getContractFactory("Deposit")).deploy(contracts.tornToken,contracts.Deposit);
    // await ExitQueue_logic.deployed();
    // console.log("ExitQueue_logic.address",ExitQueue_logic.address)
    // await mExitQueue_proxy.connect(users.proxy_admin).upgradeTo(ExitQueue_logic.address);
    //  console.log("upgradeTo(ExitQueue_logic.address)")
    // await mExitQueue.connect(users.operator).migrant();
    //  console.log("migrant")

}

main()
    .then(() => process.exit())
    .catch(error => {
        console.error(error);
        process.exit(1);
    })


