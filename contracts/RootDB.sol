pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Interface/IRelayerRegistry.sol";
import "./Deposit.sol";

contract RootDB is OwnableUpgradeable, ERC20Upgradeable {

    address public   exitQueueContract;
    address public   depositContract;
    address public   inComeContract;
    address public   operator;
    address public   profitRecordContract;
    uint256 public   MAX_RELAYER_COUNTER;
    mapping(uint256 => address) public  mRelayers;

    address immutable public TORN_CONTRACT;
    address immutable public TORN_RELAYER_REGISTRY;


    event Income(address from, uint vaule);


    function setOperator(address _operator) external onlyOwner
    {
        operator = _operator;
    }


    constructor(
        address _torn_relayer_registry,
        address _torn_contract
    ) {
        TORN_CONTRACT = _torn_contract;
        TORN_RELAYER_REGISTRY = _torn_relayer_registry;
    }

    /** ---------- init ---------- **/
    function __RootManger_init(address _in_come_contract, address _deposit_contract, address _exit_queue_contract, address _profit_record_contract) public initializer {
        __RootManger_init_unchained(_in_come_contract, _deposit_contract, _exit_queue_contract, _profit_record_contract);
        __ERC20_init("relayer_dao", "relayer_dao_token");
        __Ownable_init();
    }

    function __RootManger_init_unchained(address _in_come_contract, address _deposit_contract, address _exit_queue_contract, address _profit_record_contract) public onlyInitializing {
        inComeContract = _in_come_contract;
        depositContract = _deposit_contract;
        exitQueueContract = _exit_queue_contract;
        profitRecordContract = _profit_record_contract;
    }
    // save gas
    function addRelayer(address _relayer, uint256 index) external onlyOwner
    {
        require(index <= MAX_RELAYER_COUNTER, "too large index");

        uint256 counter = MAX_RELAYER_COUNTER;
        //save gas
        for (uint256 i = 0; i < counter; i++) {
            require(mRelayers[i] != _relayer, "repeated");
        }

        if (index == MAX_RELAYER_COUNTER) {
            MAX_RELAYER_COUNTER += 1;
        }

        require(mRelayers[index] == address(0), "index err");

        mRelayers[index] = _relayer;
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

    modifier onlyInComeContract() {
        require(msg.sender == inComeContract, "Caller is not inComeContract");
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
    function totalTorn() public view returns (uint256 ret){
        ret = Deposit(depositContract).totalBalanceOfTorn();
        ret += ERC20Upgradeable(TORN_CONTRACT).balanceOf(inComeContract);
        ret += this.totalRelayerTorn();
    }

    function safeDeposit(address account, uint256 value) onlyDepositContract external returns (uint256) {
        uint256 total = totalSupply();
        uint256 to_mint;
        if (total == uint256(0)) {
            to_mint = 10 * 10 ** decimals();
        }
        else {// valve / ( totalTorn() + value) = to_mint/(totalSupply()+ to_mint)
            to_mint = total * value / this.totalTorn();
        }
        _mint(account, to_mint);
        return to_mint;
    }

    function safeWithdraw(address account, uint256 _to_burn) onlyDepositContract public {
        _burn(account, _to_burn);
    }


    function addIncome(uint256 amount) onlyInComeContract external {
        emit Income(msg.sender, amount);
    }

    function balanceOfTorn(address account) public view returns (uint256){
        return valueForTorn(this.balanceOf(account));
    }

    function valueForTorn(uint256 value_token) public view returns (uint256){
        return value_token * (this.totalTorn()) / (totalSupply());
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
