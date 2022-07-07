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


export interface USER_FIX {
    deployer1: SignerWithAddress,
    owner: SignerWithAddress,
    proxy_admin: SignerWithAddress;
    reward: SignerWithAddress;
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
    [deployer1, owner, proxy_admin, operator,reward,relayer1, relayer2, relayer3, user1, user2, user3, stake1, stake2, stake3, dao_relayer1, dao_relayer2, dao_relayer3, owner2] = await ethers.getSigners();
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

export async function get_eth_fixture(){

    let  contracts ={}
    const addressBook = {
        usdcToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        usdtToken:'0xdAC17F958D2ee523a2206206994597C13D831ec7',
        daiToken: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
        wethToken: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
        tornToken: '0x77777FeDdddFfC19Ff86DB637967013e6C6A116C',
        mRootDb: '0x2fB6ac90378d4065a0D750cE42CDDD7E85835609',
        mIncome: '0x875d48f26b1f0e41D62A76446A5D25905Bcf6395',
        mDeposit: '0x3654EcfC4e406c8320DCE4Af95C318369488f6b6',
        mExitQueue: '0x4Ddc2B9a75b67D8A049475838CF3D1326aCc0177',
        TornGovStaking:"0x5efda50f22d34f262c29268506c5fa42cb56a1ce",
        relayerRegistry: '0x58E8dCC13BE9780fC42E8723D8EaD4CF46943dF2',
        mProfitRecord:"0xdB97042c66A41740cD5C58BCF934151F9E09cA6f",
        mTornadoStakingRewards:"0x2FC93484614a34f26F7970CBB94615bA109BB4bf",
        MTornRouter:"0xd90e2f925DA726b50C4Ed8D0Fb90Ad053324F31b",
        multicall: '0x5BA1e12693Dc8F9c48aAD8770482f4739bEeD696',
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

export async function get_bsc_fixture(){

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
