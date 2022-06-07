pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../Interface/IRelayerRegistry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../Interface/ITornadoGovernanceStaking.sol";
import "../Interface/ITornadoStakingRewards.sol";
import "./mockTornadoGovernanceStaking.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

contract MTornadoStakingRewards is ITornadoStakingRewards {

    address  TornadoGovernanceStaking;
    address immutable public TORN_CONTRACT;

    event RewardPaid(address indexed user, uint256 reward);

    constructor(address TornadoGovernanceStaking_,address torn_addr) {
        TornadoGovernanceStaking = TornadoGovernanceStaking_;
         TORN_CONTRACT = torn_addr;
    }


    function getReward() override external {
        uint256 reward = MTornadoGovernanceStaking(TornadoGovernanceStaking).getReward(msg.sender);
 //       console.log("addr- > %s,%s",msg.sender,reward);
  //      console.log("balanceOf %s",ERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this) ));
        SafeERC20Upgradeable.safeTransfer(ERC20Upgradeable(TORN_CONTRACT),msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }
    function checkReward(address account) override external view returns (uint256 rewards){
        rewards =  MTornadoGovernanceStaking(TornadoGovernanceStaking).checkReward(account);
    }
}




