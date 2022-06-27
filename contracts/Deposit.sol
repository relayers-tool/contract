pragma solidity ^0.8.0;
import "./Interface/ITornadoStakingRewards.sol";
import "./Interface/ITornadoGovernanceStaking.sol";
import "./Interface/IRelayerRegistry.sol";
import "./RootDB.sol";
import "./ProfitRecord.sol";
import "./ExitQueue.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-IERC20PermitUpgradeable.sol";


contract Deposit is  ReentrancyGuardUpgradeable {

    address immutable public TORN_CONTRACT;
    address immutable public TORN_GOVERNANCE_STAKING;
    address immutable public TORN_RELAYER_REGISTRY;
    address immutable public ROOT_DB;


    address public rewardAddress;
    uint256 public profitRatio;
    uint256 public maxReserveTorn;
    uint256 public maxRewardInGov;
    uint256 constant public  IN_SUFFICIENT = 2**256 - 1;
    uint256 constant public  SUFFICIENT = 2**256 - 2;
    /** ---------- constructor ---------- **/
    constructor(
        address _torn_contract,
        address _torn_governance_staking,
        address _torn_relayer_registry,
        address _root_manager
    ) {
        TORN_CONTRACT = _torn_contract;
        TORN_GOVERNANCE_STAKING = _torn_governance_staking;
        TORN_RELAYER_REGISTRY = _torn_relayer_registry;
        ROOT_DB = _root_manager;
    }

    /** ---------- modifier ---------- **/
    modifier onlyOperator() {
        require(msg.sender == RootDB(ROOT_DB).operator(), "Caller is not operator");
        _;
    }

    modifier onlyExitQueue() {
        require(msg.sender == RootDB(ROOT_DB).exitQueueContract(), "Caller is not exitQueue");
        _;
    }

    /** ---------- init ---------- **/
    function __Deposit_init() public initializer {
        __ReentrancyGuard_init();
    }


    event lock_to_gov(uint256 _amount);

    function _checkLock2Gov() internal  {
        // the follow code will never run
        //    if(isNeedTransfer2Queue()){
        //        return ;
        //    }
        uint256 balance = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));
        if(maxReserveTorn >= balance){
            return ;
        }

        SafeERC20Upgradeable.safeApprove(IERC20Upgradeable(TORN_CONTRACT),TORN_GOVERNANCE_STAKING, balance);
        ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockWithApproval(balance);
        emit lock_to_gov(balance);
    }

    // index 1 maxReserveTorn;
    // index 2 _maxRewardInGov;
    // index 3 _rewardAddress
    // index 3 profitRatio  x/1000
    function setPara(uint256 index,uint256 value) external onlyOperator {
        require(value > 0,"Invalid para");
        if(index ==1){
            maxReserveTorn = value;
        }else if(index == 2){
            maxRewardInGov = value;
        }else if(index == 3){
            rewardAddress = address(uint160(value));
        }else  if(index == 4){
            profitRatio = value;
        }
        else{
            require(false,"Invalid para");
        }

    }

    function  _nextExitQueueValue()  view internal returns(uint256 value){
        value = ExitQueue(RootDB(ROOT_DB).exitQueueContract()).nextValue();
    }


// inorder to  reduce the complex the unlock only check the value
    function getValueShouldUnlockFromGov() public view returns (uint256) {

        uint256 next_value = _nextExitQueueValue();
        if(next_value == 0 ){
            return 0;
        }
        uint256 this_balance = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));

        if(next_value <= this_balance){
            return 0;
        }
        uint256 shortage =  next_value -IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this)) ;
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
       uint256 next_value = _nextExitQueueValue();
        if(next_value == 0 ){
            return false;
        }
        return IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this)) > next_value;
    }


    function stake2Node(uint256 _index, uint256 _amount) external onlyOperator {
        address _relayer = RootDB(ROOT_DB).mRelayers(_index);
        require(_relayer != address(0), 'Invalid index');
        SafeERC20Upgradeable.safeApprove(IERC20Upgradeable(TORN_CONTRACT),TORN_RELAYER_REGISTRY, _amount);
        IRelayerRegistry(TORN_RELAYER_REGISTRY).stakeToRelayer(_relayer, _amount);
    }

    function depositIni(address addr) external onlyOperator {
        uint256 root_token = RootDB(ROOT_DB).safeDeposit(addr, 300*(10**18));
        ProfitRecord(RootDB(ROOT_DB).profitRecordContract()).newDeposit(addr,300*(10**18),root_token);
    }


    function deposit(uint256 _amount,uint256 deadline, uint8 v, bytes32 r, bytes32 s) external {
        IERC20PermitUpgradeable(TORN_CONTRACT).permit(msg.sender, address(this), _amount, deadline, v, r, s);
        depositWithApproval(_amount);
    }

    function depositWithApproval(uint256 _qty) public nonReentrant {
        address _account = msg.sender;
        require(_qty > 0,"error para");
        uint256 root_token = RootDB(ROOT_DB).safeDeposit(_account, _qty);
        SafeERC20Upgradeable.safeTransferFrom(IERC20Upgradeable(TORN_CONTRACT),_account, address(this), _qty);
        //record the deposit
        ProfitRecord(RootDB(ROOT_DB).profitRecordContract()).newDeposit(msg.sender,_qty,root_token);

        // this is designed to avoid pay too much gas by one user
         if(isNeedTransfer2Queue()){
             ExitQueue(RootDB(ROOT_DB).exitQueueContract()).executeQueue();
        }else if(isNeedClaimFromGov()){
             _claimRewardFromGov();
         } else{
             uint256 need_unlock =  getValueShouldUnlockFromGov();

             if(need_unlock == 0){
                 _checkLock2Gov();
                 return ;
             }
            if(need_unlock != IN_SUFFICIENT){
                ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).unlock(need_unlock);
             }
         }

    }
// avoid to waste gas return more info
    function getValueShouldUnlock(uint256 _amount_token)  public view  returns (uint256 shortage,uint256 torn){
        uint256 this_balance_tron = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));
        // _amount_token
         torn = RootDB(ROOT_DB).valueForTorn(_amount_token);
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

   function _safeDrawWith_1(uint256 _amount_token) internal  returns (uint256){
//       require(RootDB(ROOT_DB).balanceOf(msg.sender) >= _amount_token  ,"balance Insufficient");
       require(_amount_token > 0,"error para");
       uint256  shortage;
       uint256 torn;
       (shortage,torn) = getValueShouldUnlock(_amount_token);
       require(shortage != IN_SUFFICIENT, 'pool Insufficient');
       if(shortage != SUFFICIENT) {
           ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).unlock(shortage);
       }
       RootDB(ROOT_DB).safeWithdraw(msg.sender, _amount_token);
       return torn;
   }

    function _safeSendTorn(uint256 _amount_token,uint256 torn,uint256 profit) internal returns(uint256 ret) {

        profit = profit*profitRatio/1000;
        //send to  profitAddress
        if(profit > 0){
            SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(TORN_CONTRACT),rewardAddress, profit);
        }
        ret = torn-profit;
        //send to  user address
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(TORN_CONTRACT),msg.sender, ret);
    }

    event with_draw(address  account,uint256 _amount_token,uint256 torn,uint256 profi);
    function withDraw(uint256 _amount_token)  public nonReentrant {
        require( _nextExitQueueValue() == 0,"Queue not empty");
        address profit_address = RootDB(ROOT_DB).profitRecordContract();
        uint256 profit = ProfitRecord(profit_address).withDraw(msg.sender,_amount_token);
        uint256 torn = _safeDrawWith_1(_amount_token);
        _safeSendTorn(_amount_token,torn,profit);
        emit with_draw(msg.sender,_amount_token,torn,profit);
    }

    //because of nonReentrant have to supply this function forn exitQueue
    function withdraw_for_exit(address addr,uint256 _amount_token)  external onlyExitQueue returns (uint256) {
        address profit_address = RootDB(ROOT_DB).profitRecordContract();
        uint256 profit = ProfitRecord(profit_address).withDraw(addr,_amount_token);
        uint256 torn = _safeDrawWith_1(_amount_token);
        return _safeSendTorn(_amount_token,torn,profit);
    }


    /** ---------- public getting ---------- **/
    function totalBalanceOfTorn()  external view returns (uint256 _t) {
        _t  = IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this));
        _t += balanceOfStakingOnGov();
        _t += checkRewardOnGov();
    }

    function isBalanceEnough(uint256 _amount_token)  external view returns (bool) {
        if( _nextExitQueueValue() != 0){
            return false;
        }
        uint256  shortage;
        (shortage,) = getValueShouldUnlock(_amount_token);
        return shortage < IN_SUFFICIENT;
    }

    function balanceOfStakingOnGov() public view returns (uint256 t) {
        t =ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).lockedBalance(address(this));
    }

    function checkRewardOnGov()  public view returns (uint256) {
        return ITornadoStakingRewards(ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).Staking()).checkReward(address(this));
    }

    /** ---------- private ---------- **/
    function _claimRewardFromGov() internal {
        address _stakingRewardContract = ITornadoGovernanceStaking(TORN_GOVERNANCE_STAKING).Staking();
        ITornadoStakingRewards(_stakingRewardContract).getReward();
    }


}
