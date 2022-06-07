pragma solidity ^0.8.0;


import "hardhat/console.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../Interface/IRelayerRegistry.sol";
import "./mockLib.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./mockTornadoGovernanceStaking.sol";

contract MRelayerRegistry is IRelayerRegistry{

    address immutable  public TORN_CONTRACT;
    address immutable  public TORN_STAKING_REWARDS;
    uint256 public counter;
    mapping(address => uint256) public stakeValue;
    address[] array;

    constructor(address gov_staking_rewards,address torn_address){
        TORN_STAKING_REWARDS = gov_staking_rewards;
         TORN_CONTRACT = torn_address;
    }



    function register(address relayer ,uint256 stake) external {
        for(uint256 i = 0 ;i < array.length ; ++i){
            require(array[i] != relayer);
        }
        counter += 1 ;
        array.push(relayer);
        return stakeToRelayer(relayer,stake);
    }

    function stakeToRelayer(address relayer, uint256 stake)  override public {
          // require(stake > 0 ,"stake == 0");
        stakeValue[relayer]= stakeValue[relayer] + stake;
//       console.log("allowance %d",IERC20Upgradeable(TORN_CONTRACT).allowance(msg.sender,address(this)));
//        console.logAddress(msg.sender);
//        console.logAddress(address(this));
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(TORN_CONTRACT),msg.sender,address(this),stake);
    }


    function getRelayerBalance(address relayer) override external view returns (uint256){
        return  stakeValue[relayer];
    }

    function notice_tron_router_withdraw(uint256 value) external {
        uint256 tempTime = block.timestamp;
        address relayer = array[tempTime%counter];
        while(stakeValue[relayer] <value){
//            console.log("index %d remain: %d vaule: %d",tempTime%counter,stakeValue[relayer],value);
            tempTime += 1;
            relayer = array[tempTime%counter];
        }
        stakeValue[relayer] =  stakeValue[relayer] -value;
        ERC20(TORN_CONTRACT).approve(TORN_STAKING_REWARDS,value);
        MTornadoGovernanceStaking(TORN_STAKING_REWARDS).addRewardAmount(value);
    }

}
