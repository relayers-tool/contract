pragma solidity ^0.8.0;
import "./Interface/IDepositContract.sol";
import "./RootDB.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";

contract ProfitRecord is ContextUpgradeable{

    address immutable public ROOT_DB;
    address immutable public TORN_CONTRACT;

    struct PRICE_STORE {
        uint256 price;
        uint256 amount;
    }

    mapping(address => PRICE_STORE) public profitStore;


      modifier onlyDepositContract() {
        require(msg.sender == RootDB(ROOT_DB).depositContract(), "Caller is not depositContract");
        _;
    }


    /** ---------- constructor ---------- **/
    constructor(address _torn_contract, address _root_db ) {
        TORN_CONTRACT = _torn_contract;
        ROOT_DB = _root_db;
    }

    /** ---------- init ---------- **/
    function __ProfitRecord_init() public initializer {
         __Context_init();
    }


    function  newDeposit(address addr,uint256 torn_amount,uint256 amount_root_token)  onlyDepositContract public{
        PRICE_STORE memory userStore = profitStore[addr];
        if(userStore.amount == 0){
           uint256 new_price = torn_amount*(10**18)/amount_root_token;
           profitStore[addr].price = new_price;
           profitStore[addr].amount = amount_root_token;
        }else{
              // calc weighted average
              profitStore[addr].price =  (userStore.amount*userStore.price +torn_amount*(10**18))/(amount_root_token+userStore.amount);
              profitStore[addr].amount =  amount_root_token+userStore.amount;
        }

    }

    function  withDraw(address addr,uint256 amount_root_token)  onlyDepositContract public returns (uint256 profit) {
        profit = getProfit(addr,amount_root_token);
        if(profitStore[addr].amount > amount_root_token){
            profitStore[addr].amount -= amount_root_token;
        }
        else{
           delete profitStore[addr];
        }
    }

    function  getProfit(address addr,uint256 amount_root_token) public view returns (uint256 profit){
        PRICE_STORE memory userStore = profitStore[addr];
        require(userStore.amount >= amount_root_token,"err root token");
        uint256 value = RootDB(ROOT_DB).valueForTorn(amount_root_token);
        profit = value - (userStore.price*amount_root_token/10**18);
    }

}
