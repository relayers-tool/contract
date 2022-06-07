import { expect } from "chai";
import { ethers } from "hardhat";
import {MERC20} from "../typechain";

describe("RelayerDAOProxy", function () {
    it("Should proxy", async function () {
        const tornContract = "0x0000000000000000000000000000000000000001";
        const tornGovernanceStaking = "0x0000000000000000000000000000000000000002";
        const tornRelayerRegistry = "0x0000000000000000000000000000000000000003";
        const root_manager = "0x0000000000000000000000000000000000000004";
        const [, deployer2] = await ethers.getSigners();

        const Deposit = await ethers.getContractFactory('Deposit');
        const logicContract = await Deposit.deploy(tornContract, tornGovernanceStaking, tornRelayerRegistry,root_manager);
        await logicContract.deployed();

        const RelayerDAOProxy = await ethers.getContractFactory("RelayerDAOProxy");
        const proxy = await RelayerDAOProxy.deploy(logicContract.address, deployer2.address, "0x");
        await proxy.deployed();
        const proxy2 = RelayerDAOProxy.attach(proxy.address);

        const proxyDeposit = Deposit.attach(proxy.address);
        expect(await proxyDeposit.TORN_CONTRACT()).to.equal(tornContract);
        expect(await proxyDeposit.TORN_GOVERNANCE_STAKING()).to.equal(tornGovernanceStaking);
        expect(await proxyDeposit.TORN_RELAYER_REGISTRY()).to.equal(tornRelayerRegistry);

        // migrate
        const tornContractUP = "0x0000000000000000000000000000000000000005";
        const tornGovernanceStakingUP = "0x0000000000000000000000000000000000000006";
        const tornRelayerRegistryUP = "0x0000000000000000000000000000000000000007";
        const root_managerUp = "0x0000000000000000000000000000000000000008";
        const logicContractUP = await Deposit.deploy(tornContractUP, tornGovernanceStakingUP, tornRelayerRegistryUP,root_managerUp);
        await logicContractUP.deployed();

        const tx = await proxy.connect(deployer2).upgradeTo(logicContractUP.address);
        await tx.wait();

        expect(await proxyDeposit.TORN_CONTRACT()).to.equal(tornContractUP);
        expect(await proxyDeposit.TORN_GOVERNANCE_STAKING()).to.equal(tornGovernanceStakingUP);
        expect(await proxyDeposit.TORN_RELAYER_REGISTRY()).to.equal(tornRelayerRegistryUP);
    });


    it("Should proxy 2", async function () {

        let usdc_erc20: MERC20 = await (await ethers.getContractFactory("MERC20")).deploy("usdc","mock_usdc",6);
        const [, deployer2] = await ethers.getSigners();
        await usdc_erc20.mint(deployer2.address,5000);
        expect(await usdc_erc20.balanceOf(deployer2.address)).equal(5000);
        expect(await usdc_erc20.totalSupply()).equal(5000);

        const RelayerDAOProxy = await ethers.getContractFactory("RelayerDAOProxy");
        const proxy = await RelayerDAOProxy.deploy(usdc_erc20.address, deployer2.address, "0x");
        await proxy.deployed();

        const proxy_torn = await usdc_erc20.attach(proxy.address);
        expect(await proxy_torn.balanceOf(deployer2.address)).equal(0);
        expect(await proxy_torn.totalSupply()).equal(0);

        await proxy_torn.mint(deployer2.address,5000);
        expect(await proxy_torn.balanceOf(deployer2.address)).equal(5000);
        expect(await proxy_torn.totalSupply()).equal(5000);

    });




});
