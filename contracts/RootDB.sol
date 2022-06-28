pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Interface/IRelayerRegistry.sol";
import "./Deposit.sol";

/**
 * @title Database for relayer dao
 * @notice this is a modified erc20 token because of saving gas.
 *         1. removed approve
 *         2. only able to transfer to or from exitQueueContract
 *         3. only transferFrom by exitQueueContract without approve
 * @notice  the token is the voucher of the deposit
 *          token/totalSupply  is the percentage of the user
 */


contract RootDB is OwnableUpgradeable, ERC20Upgradeable {
    /// the address of  exitQueue contract
    address public   exitQueueContract;
    /// the address of  deposit contract
    address public   depositContract;
    /// the address of  inCome contract
    address public   inComeContract;
    /// the address of  operator set by owner
    address public   operator;
    /// the address of  profitRecord contract
    address public   profitRecordContract;
    /// the max counter of  relayers
    uint256 public   MAX_RELAYER_COUNTER;
    /// mapping index to relayers address
    mapping(uint256 => address) public  mRelayers;

    /// the address of  torn token contract
    address immutable public TORN_CONTRACT;
    /// the address of  torn relayer registry
    address immutable public TORN_RELAYER_REGISTRY;



    /**
     * @notice Called by the Owner to set operator
     * @param _operator The address of the new operator
     */
    function setOperator(address _operator) external onlyOwner
    {
        operator = _operator;
    }

    /**
     * @param _torn_relayer_registry :the address of  torn relayer registry
     * @param _torn_contract : the address of  torn token contract
     */
    constructor(
        address _torn_relayer_registry,
        address _torn_contract
    ) {
        TORN_CONTRACT = _torn_contract;
        TORN_RELAYER_REGISTRY = _torn_relayer_registry;
    }


    /**
      * @notice Function used to propose a new proposal. Sender must have delegates above the proposal threshold
      * @param _in_come_contract Target addresses for proposal calls
      * @param _deposit_contract Eth values for proposal calls
      * @param _exit_queue_contract Function signatures for proposal calls
      * @param _profit_record_contract Calldatas for proposal calls
      **/
    function __RootDB_init(address _in_come_contract, address _deposit_contract, address _exit_queue_contract, address _profit_record_contract) public initializer {
        __RootDB_init_unchained(_in_come_contract, _deposit_contract, _exit_queue_contract, _profit_record_contract);
        __ERC20_init("relayer_dao", "relayer_dao_token");
        __Ownable_init();
    }

    function __RootDB_init_unchained(address _in_come_contract, address _deposit_contract, address _exit_queue_contract, address _profit_record_contract) public onlyInitializing {
        inComeContract = _in_come_contract;
        depositContract = _deposit_contract;
        exitQueueContract = _exit_queue_contract;
        profitRecordContract = _profit_record_contract;
    }
    // save gas
    function addRelayer(address relayer, uint256 index) external onlyOwner
    {
        require(index <= MAX_RELAYER_COUNTER, "too large index");

        uint256 counter = MAX_RELAYER_COUNTER;
        //save gas
        for (uint256 i = 0; i < counter; i++) {
            require(mRelayers[i] != relayer, "repeated");
        }

        if (index == MAX_RELAYER_COUNTER) {
            MAX_RELAYER_COUNTER += 1;
        }

        require(mRelayers[index] == address(0), "index err");

        mRelayers[index] = relayer;
    }

    function removeRelayer(uint256 index) external onlyOwner
    {
        require(index < MAX_RELAYER_COUNTER, "too large index");

        // save gas
        if (index + 1 == MAX_RELAYER_COUNTER) {
            MAX_RELAYER_COUNTER -= 1;
        }

        require(mRelayers[index] != address(0), "index err");
        delete mRelayers[index];
    }

    modifier onlyDepositContract() {
        require(msg.sender == depositContract, "Caller is not depositContract");
        _;
    }


    function totalRelayerTorn() external view returns (uint256 ret){
        ret = 0;
        address relay;
        uint256 counter = MAX_RELAYER_COUNTER;
        //save gas
        for (uint256 i = 0; i < counter; i++) {
            relay = mRelayers[i];
            if (relay != address(0)) {
                ret += IRelayerRegistry(TORN_RELAYER_REGISTRY).getRelayerBalance(relay);
            }
        }
    }

    //  Deposit torn + eInCome torn + totalRelayerTorn
    function totalTorn() public view returns (uint256 qty){
        qty = Deposit(depositContract).totalBalanceOfTorn();
        qty += ERC20Upgradeable(TORN_CONTRACT).balanceOf(inComeContract);
        qty += this.totalRelayerTorn();
    }

    function safeDeposit(address account, uint256 qty) onlyDepositContract external returns (uint256) {
        uint256 total = totalSupply();
        uint256 to_mint;
        if (total == uint256(0)) {
            to_mint = 10 * 10 ** decimals();
        }
        else {// valve / ( totalTorn() + value) = to_mint/(totalSupply()+ to_mint)
            to_mint = total * qty / this.totalTorn();
        }
        _mint(account, to_mint);
        return to_mint;
    }

    function safeWithdraw(address account, uint256 to_burn) onlyDepositContract public {
        _burn(account, to_burn);
    }


    function balanceOfTorn(address account) public view returns (uint256){
        return valueForTorn(this.balanceOf(account));
    }

    function valueForTorn(uint256 token_qty) public view returns (uint256){
        return token_qty * (this.totalTorn()) / (totalSupply());
    }

    // overwite this function inorder to prevent user transfer root token
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        address owner = _msgSender();
        require(owner == exitQueueContract || to == exitQueueContract, "err transfer");
        _transfer(owner, to, amount);
        return true;
    }

    function transferFrom(
        address from,
        address to,
        uint256 amount
    ) public virtual override returns (bool) {
        // only approve to exitQueueContract to save gas
        require(_msgSender() == exitQueueContract, "err transferFrom");
        //_spendAllowance(from, spender, amount); to save gas
        _transfer(from, to, amount);
        return true;
    }

    function approve(address spender, uint256 amount) public virtual override returns (bool ret) {
        ret = false;
        require(false, "err approve");
    }


}
