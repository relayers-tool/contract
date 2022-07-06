// We import the hardhat environment field we are planning to use
import {deployments, ethers} from 'hardhat';
import {
    Deposit,
    ExitQueue,
    Income,
    MERC20,
    MRelayerRegistry,
    MTornadoGovernanceStaking,
    MTornadoStakingRewards,
    MTornRouter,
    ProfitRecord, RelayerDAOProxy,
    RootDB
} from "../typechain-types";
import {SignerWithAddress} from "hardhat-deploy-ethers/signers";
import {expect} from "chai";


async function config_check() {
    const contracts = {
        mock_torn: (await deployments.get('mock_torn')).address,
        mock_dai: (await deployments.get('mock_dai')).address,
        mock_usdc: (await deployments.get('mock_usdc')).address,
        mock_weth: (await deployments.get('mock_weth')).address,
        mTornadoGovernanceStaking: (await deployments.get('MTornadoGovernanceStaking')).address,
        mRelayerRegistry: (await deployments.get('MRelayerRegistry')).address,
        mTornadoStakingRewards: (await deployments.get('MTornadoStakingRewards')).address,
        Deposit: (await deployments.get('Deposit')).address,
        RootDb: (await deployments.get('RootDb')).address,
        ExitQueue: (await deployments.get('ExitQueue')).address,
        Income: (await deployments.get('Income')).address,
        MTornRouter: (await deployments.get('MTornRouter')).address,
    };
    let mRootDb = <RootDB>await (await ethers.getContractFactory("RootDB")).attach(contracts.RootDb);

    expect(await mRootDb.exitQueueContract()).equal(contracts.ExitQueue);
    expect(await mRootDb.TORN_CONTRACT()).equal(contracts.mock_torn);
    expect(await mRootDb.TORN_RELAYER_REGISTRY()).equal(contracts.mRelayerRegistry);
    expect(await mRootDb.inComeContract()).equal(contracts.Income);
    expect(await mRootDb.exitQueueContract()).equal(contracts.ExitQueue);
    expect(await mRootDb.depositContract()).equal(contracts.Deposit);

}

export interface USER_FIX {
    owner: SignerWithAddress,
    proxy_admin: SignerWithAddress;
    deployer1: SignerWithAddress,
    relayer1: SignerWithAddress;
    relayer2: SignerWithAddress,
    relayer3: SignerWithAddress,
    user1: SignerWithAddress,
    user2: SignerWithAddress,
    user3: SignerWithAddress,
    operator: SignerWithAddress;
    stake1: SignerWithAddress,
    stake2: SignerWithAddress,
    stake3: SignerWithAddress;
    dao_relayer1: SignerWithAddress,
    dao_relayer2: SignerWithAddress,
    dao_relayer3: SignerWithAddress,
    reward: SignerWithAddress;
    owner2: SignerWithAddress
}

export async function get_user_fixture() {
    let owner2: SignerWithAddress, proxy_admin: SignerWithAddress;
    let deployer1: SignerWithAddress, owner: SignerWithAddress, relayer1: SignerWithAddress;
    let relayer2: SignerWithAddress, relayer3: SignerWithAddress, user1: SignerWithAddress, user2: SignerWithAddress,
        user3: SignerWithAddress, operator: SignerWithAddress;
    let stake1: SignerWithAddress, stake2: SignerWithAddress, stake3: SignerWithAddress;
    let dao_relayer1: SignerWithAddress, dao_relayer2: SignerWithAddress, dao_relayer3: SignerWithAddress,
        reward: SignerWithAddress;
    // @ts-ignore
    [deployer1, owner, proxy_admin, operator, relayer1, relayer2, relayer3, user1, user2, user3, stake1, stake2, stake3, dao_relayer1, dao_relayer2, dao_relayer3, owner2, reward] = await ethers.getSigners();
    return {
        deployer1,
        owner,
        proxy_admin,
        operator,
        relayer1,
        relayer2,
        relayer3,
        user1,
        user2,
        user3,
        stake1,
        stake2,
        stake3,
        dao_relayer1,
        dao_relayer2,
        dao_relayer3,
        owner2,
        reward
    };

}


async function CreateFix(contracts: any) {
    let torn_erc20: MERC20;
    let usdc_erc20: MERC20;
    let dai_erc20: MERC20;
    let weth_erc20: MERC20;
    let mTornadoGovernanceStaking: MTornadoGovernanceStaking;
    let mRelayerRegistry: MRelayerRegistry;
    let mTornadoStakingRewards: MTornadoStakingRewards;

    let mTornRouter: MTornRouter;
    let mRootDb: RootDB;
    let mDeposit: Deposit;
    let mExitQueue: ExitQueue;
    let mIncome: Income;

    let mDeposit_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.Deposit);
    let mExitQueue_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.ExitQueue);
    let mRootDb_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.RootDb);
    let mIncome_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.Income);
    let mProfitRecord_proxy = <RelayerDAOProxy>await (await ethers.getContractFactory("RelayerDAOProxy")).attach(contracts.mProfitRecord);


    torn_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_torn);
    usdc_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_usdc);
    dai_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_dai);
    weth_erc20 = <MERC20>(await ethers.getContractFactory("MERC20")).attach(contracts.mock_weth);

    mRelayerRegistry = <MRelayerRegistry>(await ethers.getContractFactory("MRelayerRegistry")).attach(contracts.mRelayerRegistry);
    mTornadoStakingRewards = <MTornadoStakingRewards>(await ethers.getContractFactory("MTornadoStakingRewards")).attach(contracts.mTornadoStakingRewards);
    mTornadoGovernanceStaking = <MTornadoGovernanceStaking>(await ethers.getContractFactory("MTornadoGovernanceStaking")).attach(contracts.mTornadoGovernanceStaking);


    mRootDb = <RootDB>await (await ethers.getContractFactory("RootDB")).attach(contracts.RootDb);

    mIncome = <Income>await (await ethers.getContractFactory("Income")).attach(contracts.Income);

    mTornRouter = <MTornRouter>await (await ethers.getContractFactory("MTornRouter")).attach(contracts.MTornRouter);

    mDeposit = <Deposit>await (await ethers.getContractFactory("Deposit")).attach(contracts.Deposit);

    mExitQueue = <ExitQueue>await (await ethers.getContractFactory("ExitQueue")).attach(contracts.ExitQueue);
    let mProfitRecord: ProfitRecord = <ProfitRecord>await (await ethers.getContractFactory("ProfitRecord")).attach(contracts.mProfitRecord);

    await config_check();
    // finally we return the whole object (including the tokenOwner set_up as a User object)
    return {
        usdc_erc20,
        dai_erc20,
        weth_erc20,
        torn_erc20,
        mRelayerRegistry,
        mTornadoStakingRewards,
        mTornadoGovernanceStaking,
        mRootDb,
        mIncome,
        mTornRouter,
        mDeposit,
        mExitQueue,
        mProfitRecord,
        mDeposit_proxy,
        mExitQueue_proxy,
        mRootDb_proxy,
        mIncome_proxy,
        mProfitRecord_proxy,
    };
}

export async function get_bsc_fixture(){
    const network = await ethers.getDefaultProvider().getNetwork();
    let ChainId =network.chainId;
    let  contracts ={}
    const addressBook = {
            usdcToken: '0xc8E7d7FBaCEF6aa300c3933316dB38ceF3bE1F12',
            daiToken: '0x71B6e1B82295bf1029535FE44eBaC7Ba43217BC1',
            wethToken: '0x79B52e597cF2328EE45f51a1d07586A57aDEbf16',
            tornToken: '0x5d5776B3491bf758D52326b09a8dBe6F3b8E1388',
            mRootDb: '0x6772e36EC55e9C6c93958E5afaa58598752D4617',
            mIncome: '0x3dEbcec58743e6EBAC375d825D189A3378466155',
            mDeposit: '0x60B3e177879CcD4253FB2256b4FB01DF0FD2c5Ab',
            mExitQueue: '0xEb68522Db0abEFa730D5304dB1f5863A0fcdfD4E',
            TornGovStaking:"0x3a09Aa2658D429774544B2087E0f5364FCfa0e0a",
            relayerRegistry: '0x7BC60F27A28723217B78537A05735CF89a167adF',
            mProfitRecord:"0x25d6e698eF1B12f8220F3970D76Ec93C5E8B6Bf1",
            mTornadoStakingRewards:"0x67E323523C4FbA29EAF7FfB01D792b12B84a6526",
            MTornRouter:"0x9839e04232FE04F56DCF7Ca510b302B9E38d7c56",
            multicall: '0xC50F4c1E81c873B2204D7eFf7069Ffec6Fbe136D',

        }

         contracts = {
            mock_torn: addressBook.tornToken,
            mock_dai: addressBook.daiToken,
            mock_usdc: addressBook.usdcToken,
            mock_weth: addressBook.wethToken,
            mTornadoGovernanceStaking: addressBook.TornGovStaking,
            mRelayerRegistry: addressBook.relayerRegistry,
            mTornadoStakingRewards: addressBook.mTornadoStakingRewards,
            Deposit: addressBook.mDeposit,
            RootDb: addressBook.mRootDb,
            ExitQueue: addressBook.mExitQueue,
            Income: addressBook.mIncome,
            MTornRouter:addressBook.MTornRouter,
            mProfitRecord:addressBook.mProfitRecord,
        };

    return await CreateFix(contracts);
}

export async function set_up_fixture(fix_name: string) {
    // it first ensure the deployment is executed and reset (use of evm_snaphost for fast test)
    // await deployments.fixture(["mock_torn"]);
    expect("test_net register_relayers".includes(fix_name)).true;
    await deployments.fixture([fix_name]);
    // we get an instantiated contract in the form of a ethers.js Contract instance:
    const contracts = {
        mock_torn: (await deployments.get('mock_torn')).address,
        mock_dai: (await deployments.get('mock_dai')).address,
        mock_usdc: (await deployments.get('mock_usdc')).address,
        mock_weth: (await deployments.get('mock_weth')).address,
        mTornadoGovernanceStaking: (await deployments.get('MTornadoGovernanceStaking')).address,
        mRelayerRegistry: (await deployments.get('MRelayerRegistry')).address,
        mTornadoStakingRewards: (await deployments.get('MTornadoStakingRewards')).address,
        Deposit: (await deployments.get('Deposit')).address,
        RootDb: (await deployments.get('RootDb')).address,
        ExitQueue: (await deployments.get('ExitQueue')).address,
        Income: (await deployments.get('Income')).address,
        MTornRouter: (await deployments.get('MTornRouter')).address,
        mProfitRecord: (await deployments.get('ProfitRecord')).address,
    };
    return await CreateFix(contracts);
}
