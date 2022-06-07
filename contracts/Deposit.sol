pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "./Interface/IDepositContract.sol";
import "./Interface/IRootManger.sol";
import "./Interface/IExitQueue.sol";
import "./Interface/ITornadoStakingRewards.sol";
import "./Interface/ITornadoGovernanceStaking.sol";
import "./Interface/IRelayerRegistry.sol";
import "./RootManger.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract Deposit is Initializable, IDepositContract, ReentrancyGuardUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address immutable public TORN_CONTRACT;
    address immutable public TORN_GOVERNANCE_STAKING;
    address immutable public TORN_RELAYER_REGISTRY;
    address immutable public ROOT_MANAGER;

    address  public EXIT_QUEUE;

    uint256 public maxReserveTorn;
    uint256 public maxRewardInGov;
    uint256 constant public  IN_SUFFICIENT = 2**256 - 1;
    uint256 constant public  SUFFICIENT = 2**256 - 2;
    /** ---------- constructor ---------- **/
    constructor(
        address _tornContract,
        address _tornGovernanceStaking,
        address _tornRelayerRegistry,
        address _root_manager
    ) {
        TORN_CONTRACT = _tornContract;
        TORN_GOVERNANCE_STAKING = _tornGovernanceStaking;
        TORN_RELAYER_REGISTRY = _tornRelayerRegistry;
        ROOT_MANAGER = _root_manager;

    }

    /** ---------- modifier ---------- **/
    modifier onlyOperator() {
        require(msg.sender == IRootManger(ROOT_MANAGER).operator(), "Caller is not operator");
        _;
    }

    modifier onlyExitQueue() {
        require(msg.sender == IRootManger(ROOT_MANAGER).exitQueueContract(), "Caller is not exitQueue");
        _;
    }

    /** ---------- init ---------- **/
    function __Deposit_init() public initializer {
        __ReentrancyGuard_init();
        EXIT_QUEUE = IRootManger(ROOT_MANAGER).exitQueueContract();
    }


    event lock_to_gov(uint256 _amount);

    function _checkLock2Gov() internal  {

        if(isNeedTransfer2Queue()){
            return ;
        }
        uint256 balance = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));
        if(maxReserveTorn >= balance){
            return ;
        }

        IERC20Upgradeable(TORN_CONTRACT).safeApprove(TORN_GOVERNANCE_STAKING, balance);
        ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockWithApproval(balance);
       // console.log("ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockedBalance(this) %d",ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockedBalance(address(this)));
        emit lock_to_gov(balance);
    }

    function setMaxReservePara(uint256 _amount,uint256 _maxRewardInGov) external onlyOperator {
        require(_amount > 0 &&  _maxRewardInGov > 0, 'Invalid para');
        maxReserveTorn = _amount;
        maxRewardInGov = _maxRewardInGov;
    }

// inorder to  reduce the complex the unlock only check the value
    function getValueShouldUnlockFromGov() public view returns (uint256) {

        uint256 t = IExitQueue(EXIT_QUEUE).nextValue();
        if(t == 0 ){
            return 0;
        }
        uint256 this_balance = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));

        if(t <= this_balance){
            return 0;
        }
        uint256 shortage =  t -IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this)) ;
        if(shortage <= ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockedBalance(address(this)))
        {
            return shortage;
        }
        return  IN_SUFFICIENT;
    }


    function isNeedClaimFromGov() public view returns (bool) {
        uint256 t = ITornadoStakingRewards(ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).Staking()).checkReward(address(this));
        return t > maxRewardInGov;
    }


    function isNeedTransfer2Queue() public view returns (bool) {
       uint256 t = IExitQueue(EXIT_QUEUE).nextValue();
        if(t == 0 ){
            return false;
        }
        return IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this)) > t ;

    }


    function stake2Node(uint256 _index, uint256 _amount) external onlyOperator {
        address _relayer = IRootManger(ROOT_MANAGER)._relayers(_index);
        require(_relayer != address(0), 'Invalid index');
        IERC20Upgradeable(TORN_CONTRACT).safeApprove(TORN_RELAYER_REGISTRY, _amount);
        IRelayerRegistry(TORN_RELAYER_REGISTRY).stakeToRelayer(_relayer, _amount);
    }


    function deposit(uint256 _amount,uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        IERC20PermitUpgradeable(TORN_CONTRACT).permit(msg.sender, address(this), _amount, deadline, v, r, s);
        depositWithApproval(_amount);
    }

    function depositWithApproval(uint256 _amount) public nonReentrant {
        address _account = msg.sender;
        require(IRootManger(ROOT_MANAGER).deposit(_account, _amount), 'Something went wrong on Manager Contract');
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(TORN_CONTRACT),_account, address(this), _amount);

        // this is designed to avoid pay too much gas by one user
         if(isNeedTransfer2Queue()){
           IExitQueue(EXIT_QUEUE).executeQueue();
        }else if(isNeedClaimFromGov()){
             _claimRewardFromGov();
         } else{
             uint256 need_unlock =  getValueShouldUnlockFromGov();
             if(need_unlock == 0){
                 _checkLock2Gov();
                 return ;
             }
             if(need_unlock == IN_SUFFICIENT){
                 return;
             }
            ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).unlock(need_unlock);
         }

    }
// avoid to waste gas return more info
    function getValueShouldUnlock(uint256 _amount_token)  public view  returns (uint256 shortage,uint256 torn){
        uint256 this_balance_tron = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));
        // _amount_token
         torn = IRootManger(ROOT_MANAGER).valueForTorn(_amount_token);
        if(this_balance_tron >= torn){
            shortage = SUFFICIENT;
            return (shortage,torn);
        }
        uint256 _lockingAmount = ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockedBalance(address(this));
         shortage = torn - this_balance_tron;
        if(_lockingAmount < shortage){
            shortage = IN_SUFFICIENT;
        }
    }

    function withDraw(uint256 _amount_token) override external nonReentrant returns (uint256) {
        require(IExitQueue(EXIT_QUEUE).nextValue() == 0,"Queue not empty");
        require(RootManger(ROOT_MANAGER).balanceOf(msg.sender) >= _amount_token  ,"balance Insufficient");
        uint256  shortage;
        uint256 torn;
        (shortage,torn) = getValueShouldUnlock(_amount_token);
        require(shortage != IN_SUFFICIENT, 'pool Insufficient');
        if(shortage != SUFFICIENT) {
            ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).unlock(shortage);
        }
        require(IRootManger(ROOT_MANAGER).withdraw(msg.sender, _amount_token), 'Something went wrong on Manager Contract');
        IERC20Upgradeable(TORN_CONTRACT).safeTransfer(msg.sender, torn);
        return torn;
    }

    function withdraw_for_exit(uint256 _amount_token) override external onlyExitQueue returns (uint256) {
//        require(IExitQueue(IRootManger(ROOT_MANAGER).exitQueueContract()).nextValue() == 0,"Queue not empty");
        require(RootManger(ROOT_MANAGER).balanceOf(msg.sender) >= _amount_token  ,"balance Insufficient");
        uint256  shortage;
        uint256 torn;
        (shortage,torn) = getValueShouldUnlock(_amount_token);
    //    console.log("_amount_token:%d --> torn %d",_amount_token,torn);
        require(shortage != IN_SUFFICIENT, 'Insufficient');
        if(shortage != SUFFICIENT) {
            ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).unlock(shortage);
        }
        require(IRootManger(ROOT_MANAGER).withdraw(msg.sender, _amount_token), 'Something went wrong on Manager Contract');
        IERC20Upgradeable(TORN_CONTRACT).safeTransfer(msg.sender, torn);
        return torn;
    }


    /** ---------- public getting ---------- **/
    function totalBalanceOfTorn() override external view returns (uint256 _t) {
        _t  = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));
        _t += balanceOfStakingOnGov();
        _t += checkRewardOnGov();
    }

//    function isBalanceEnough(uint256 _amount_token)  external view returns (bool) {
//        if(IExitQueue(EXIT_QUEUE).nextValue() != 0){
//            return false;
//        }
//        uint256  shortage;
//        (shortage,) = getValueShouldUnlock(_amount_token);
//        return shortage < IN_SUFFICIENT;
//    }

    function balanceOfStakingOnGov() public view returns (uint256 t) {
        t =ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockedBalance(address(this));
    }

    function checkRewardOnGov() override public view returns (uint256) {
        return ITornadoStakingRewards(ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).Staking()).checkReward(address(this));
    }

    /** ---------- private ---------- **/
    function _claimRewardFromGov() internal {
        address _stakingRewardContract = ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).Staking();
        ITornadoStakingRewards(_stakingRewardContract).getReward();
    }


}
