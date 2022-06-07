pragma solidity ^0.8.0;
import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./interface/ImockTronRouter.sol";
import "./mockLib.sol";
import "./mockRelayerRegistry.sol";

contract MTornRouter is ImockTornRouter {

    address public USDC_CONTRACT;
    address public DAI_CONTRACT;
    address public INCOME_CONTRACT;
    address public  RELAYER_REGISTRY;


    uint256 public allFeeRate = 33; // 30/10000
    uint256 public stakeFeeRate = 20; // 30/10000
    mapping(address => mapping(uint256=>uint256)) private stakeMap;

    constructor(address usdc, address dai,address inComeContract_ ,address relay_registry){
            USDC_CONTRACT = usdc;
            DAI_CONTRACT =  dai;
            INCOME_CONTRACT = inComeContract_;
            RELAYER_REGISTRY = relay_registry;
    }

    modifier onlyRelayer(address sender, address relayer) {
        _;
    }

    function Coin2Tron(string memory coinType,uint256 value) public view returns(uint256){

        if(mockLib.strcmp(coinType,"eth")){
            return  (value*2000)/(uint256(35));
        }else if(mockLib.strcmp(coinType,"dai")){
            return  ((value)/uint256(35));
        }else if(mockLib.strcmp(coinType,"usdc")){

        }
        else{
            require(false,"err type");
        }
        return  ((value)*(10**12)/uint256(35));
    }
    function memcmp(bytes memory a, bytes memory b) internal pure returns(bool){
        return (a.length == b.length) && (keccak256(a) == keccak256(b));
    }
    function strcmp(string memory a, string memory b) internal pure returns(bool){
        return memcmp(bytes(a), bytes(b));
    }

   //coinType  eth 0 usdt 1 usdc 2
    function deposit(string memory coinType,uint256 value)  payable override external {

      require(mockLib.checkValue(coinType,value), "value");
        uint256 index =  mockLib.coin2Index(coinType);
       IERC20Upgradeable contr;
        if(mockLib.strcmp(coinType,"eth")){
            require(value == msg.value,"value == msg.value");
            stakeMap[msg.sender][index]=stakeMap[msg.sender][index] + msg.value ;
            return;
        }else if(mockLib.strcmp(coinType,"usdc")){
                contr = IERC20Upgradeable(USDC_CONTRACT);
        }
        else if(mockLib.strcmp(coinType,"dai")) {
            contr = IERC20Upgradeable(DAI_CONTRACT);
        }


        require(msg.value == 0, "msg.value != 0");
        stakeMap[msg.sender][index]=stakeMap[msg.sender][index] + value;

        SafeERC20Upgradeable.safeTransferFrom(contr,msg.sender,address(this),value);
    }

    function withdraw(string memory coinType,uint256 value,address to) override external {

        require(mockLib.checkValue(coinType,value), "value");
        uint256 fee = value* allFeeRate /uint256(10000);

        IERC20Upgradeable contr;
        if(mockLib.strcmp(coinType,"eth")){
            uint256 index =  mockLib.coin2Index(coinType);
            stakeMap[msg.sender][index]=stakeMap[msg.sender][index] - value;
            value =  value - fee ;
            payable(address(to)).transfer(value);
            payable(address(INCOME_CONTRACT)).transfer(fee);
//            console.log("send torn :%d to gov staking ,fee :%d",Coin2Tron(coinType,fee)*stakeFeeRate/allFeeRate,fee);
            MRelayerRegistry(RELAYER_REGISTRY).notice_tron_router_withdraw(Coin2Tron(coinType,fee)*stakeFeeRate/allFeeRate);
            return;
        }else if(mockLib.strcmp(coinType,"usdc")){
            contr = IERC20Upgradeable(USDC_CONTRACT);
        }
        else if(mockLib.strcmp(coinType,"dai")){
            contr = IERC20Upgradeable(DAI_CONTRACT);
        }else{
        require(false,"err type");
        }
        value =  value - fee ;
        SafeERC20Upgradeable.safeTransfer(contr,to,value);
        SafeERC20Upgradeable.safeTransfer(contr,INCOME_CONTRACT,fee);
        MRelayerRegistry(RELAYER_REGISTRY).notice_tron_router_withdraw(Coin2Tron(coinType,fee)*stakeFeeRate/allFeeRate);
    }

    event Received(address, uint);
    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    event CalledFallback(address, uint);
    fallback() external payable {
        emit CalledFallback(msg.sender, msg.value);
    }


}
