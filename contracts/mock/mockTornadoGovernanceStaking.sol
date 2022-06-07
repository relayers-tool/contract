pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../Interface/IRelayerRegistry.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "../Interface/ITornadoGovernanceStaking.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";


contract LPTokenWrapper {
    using SafeMath for uint256;


    address  public y ;

    uint256 private _totalSupply;
    mapping(address => uint256) private _balances;


    constructor(address torn){
        y = torn;
    }


    function totalSupply() public view returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address account) public view returns (uint256) {
        return _balances[account];
    }

    function stake(uint256 amount) public virtual  {
        _totalSupply = _totalSupply.add(amount);
        _balances[msg.sender] = _balances[msg.sender].add(amount);
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(y),msg.sender, address(this), amount);
    }

    function withdraw(uint256 amount) public virtual {
        _totalSupply = _totalSupply.sub(amount);
        _balances[msg.sender] = _balances[msg.sender].sub(amount);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(y),msg.sender, amount);
    }
}

contract MTornadoGovernanceStaking is ITornadoGovernanceStaking, LPTokenWrapper {
    using SafeMath for uint256;


    address  public jfi;
    address public TORN_STAKING_REWARDS;

    uint256 public totalCurrentPerTokenReward;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;

    event RewardAdded(uint256 reward);
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);


    modifier updateReward(address account) {
        rewards[account] = earned(account);
        userRewardPerTokenPaid[account] = totalCurrentPerTokenReward;
        _;
    }

    constructor(address torn) LPTokenWrapper(torn){
        jfi = torn;
    }

    function setStakingRewardContract(address staking)external{
        TORN_STAKING_REWARDS = staking;
    }

    function lockWithApproval(uint256 amount) override external {
        return stake( amount);
    }

    function lock(address owner, uint256 amount, uint256 deadline, uint8 v, bytes32 r, bytes32 s) override external{
        require(msg.sender == owner,"error owner");
        return stake( amount);
    }

    function unlock(uint256 amount) override external {
         return withdraw(amount);
    }

    function Staking() override external view returns (address){
        return TORN_STAKING_REWARDS;
    }
    function lockedBalance(address account) override external view returns (uint256){
        return balanceOf(account);
    }




    function earned(address account) public view returns (uint256 ret) {
        ret =
        balanceOf(account)
        .mul(totalCurrentPerTokenReward.sub(userRewardPerTokenPaid[account]))
        .div(1e35)
        .add(rewards[account]);

    }

    // stake visibility is public as overriding LPTokenWrapper's stake() function
    function stake(uint256 amount) override public updateReward(msg.sender)   {
        require(amount > 0, "Cannot stake 0");
        super.stake(amount);
        emit Staked(msg.sender, amount);
    }

    function withdraw(uint256 amount) override public updateReward(msg.sender)  {
        require(amount > 0, "Cannot withdraw 0");
        super.withdraw(amount);
        emit Withdrawn(msg.sender, amount);
    }

    function checkReward(address account) external view returns (uint256 reward){
        reward = earned(account);

    }



   // this function have some safe mistakes  but it does not mater because of mock
    function getReward(address account) public updateReward(account) returns (uint256 reward){
        require(msg.sender == TORN_STAKING_REWARDS ,"err sender");
        reward = earned(account);
        if (reward > 0) {
            rewards[account] = 0;
        }
    }

    function addRewardAmount(uint256 reward)  external
    {
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(y),msg.sender, address(this), reward);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(y),TORN_STAKING_REWARDS, reward);
      //  console.log("send reward to TORN_STAKING_REWARDS %d",reward);
        totalCurrentPerTokenReward += (reward.mul(1e35)/totalSupply());

        emit RewardAdded(reward);
    }
}




