pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/draft-ERC20PermitUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "./Interface/IRootManger.sol";
import "./Interface/IDepositContract.sol";
import "./Interface/IinComeContract.sol";
import "./Interface/IRelayerRegistry.sol";

contract RootManger is OwnableUpgradeable,ERC20PermitUpgradeable,IRootManger{
    using SafeMath for uint256;

    address public  override exitQueueContract;
    address  public override depositContract;
    address  public override inComeContract;
    address public  override operator;

    uint256 public constant MAX_RELAYER_COUNTER = 10;
    mapping(uint256 => address) public override _relayers;

    address immutable public TORN_CONTRACT;
    address immutable public TORN_RELAYER_REGISTRY;

    function setOperator(address __operator)  external  onlyOwner
    {
        operator = __operator;
    }

    /** ---------address immutable- constructor ---------- **/
    constructor(
        address _torn_relayer_registry,
        address _tornContract
    ) {
        TORN_CONTRACT = _tornContract;
        TORN_RELAYER_REGISTRY = _torn_relayer_registry;
    }

    /** ---------- init ---------- **/
    function __RootManger_init(address _inComeContract,address _depositContract,address _exitQueueContract) public initializer {
        __RootManger_init_unchained(_inComeContract,_depositContract,_exitQueueContract);
        __ERC20_init("relayer_dao", "relayer_dao_token");
        __ERC20Permit_init("relayer_dao");
        __Ownable_init();
    }

    function __RootManger_init_unchained(address _inComeContract,address _depositContract,address _exitQueueContract) public onlyInitializing {
        inComeContract=_inComeContract;
        depositContract = _depositContract;
        exitQueueContract = _exitQueueContract;
    }

    function addRelayer(address __relayer,uint256 index)  override external  onlyOwner
    {
         require(index < MAX_RELAYER_COUNTER,"too large index");
         require(_relayers[index] == address(0),"index err");
         _relayers[index]=__relayer;
    }

    function removeRelayer(uint256 index)  override external  onlyOwner
    {
        require(index < MAX_RELAYER_COUNTER,"too large index");
        require(_relayers[index] != address(0),"index err");
        delete _relayers[index];
    }

    modifier onlyDepositContract() {
        require(_msgSender() == depositContract, "Caller is not  depositContract");
        _;
    }

    modifier onlyInComeContract() {
        require(_msgSender() == inComeContract, "Caller is not  inComeContract");
        _;
    }

    function totalRelayerTorn() override external view returns (uint256 ret){
        ret = 0;
        address relay ;
        for(uint256 i = 0 ;i < MAX_RELAYER_COUNTER ;i++){
             relay = _relayers[i];
            if(relay!= address(0)){
                ret += IRelayerRegistry(TORN_RELAYER_REGISTRY).getRelayerBalance(relay);
            }
        }
    }

    //  Deposit torn + eInCome torn + totalRelayerTorn
    function totalTorn() override public view returns (uint256 ret){
        ret =  IDepositContract(depositContract).totalBalanceOfTorn();
     //   console.log("IDepositContract(depositContract).totalBalanceOfTorn() %d", IDepositContract(depositContract).totalBalanceOfTorn());
        ret += ERC20Upgradeable(TORN_CONTRACT).balanceOf(inComeContract);
        //console.log("ERC20Upgradeable(TORN_CONTRACT).balanceOf(inComeContract) %d",ERC20Upgradeable(TORN_CONTRACT).balanceOf(inComeContract));
        ret+= this.totalRelayerTorn();
       // console.log("this.totalRelayerTorn() %d",this.totalRelayerTorn());
    }

    function deposit(address account,uint256 value) override  onlyDepositContract external returns (bool){
        uint256 total = totalSupply();
        uint256 to_mint;
        if(total == uint256(0)){
            to_mint = 10*10**decimals();
        }
        else{
            // valve / ( totalTorn() + value) = to_mint/(totalSupply()+ to_mint)
            to_mint =  total.mul(value).div(this.totalTorn());
        }
        _mint(account,to_mint);
        return true;
    }

    function withdraw(address account,uint256 to_burn) override onlyDepositContract public returns (bool){
//        uint256 total = totalSupply();
//        uint256 to_burn;
//        // to_burn = totalSupply() * value / totalTorn()
//        to_burn =  total.mul(value_token).div(this.totalTorn());
        _burn(account,to_burn);
        return true;
    }

    event Income(address from, uint vaule);
    function addIncome(uint256 amount) override onlyInComeContract external {
        emit Income(msg.sender,amount);
    }

    function balanceOfTorn(address account) override public view returns (uint256){
       return valueForTorn(this.balanceOf(account));
    }

    function valueForTorn(uint256 value_token) override  public view returns (uint256){
        return value_token.mul(this.totalTorn()).div(totalSupply());
    }
}
