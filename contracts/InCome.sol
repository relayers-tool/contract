pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./Interface/IinComeContract.sol";
import "@openzeppelin/contracts-upgradeable/utils/ContextUpgradeable.sol";
import "./RootDB.sol";
contract Income is IinComeContract , ContextUpgradeable{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    address immutable public TORN_CONTRACT;
    address immutable public ROOT_DB;


    /** ---------- constructor ---------- **/
    constructor(
        address _tornContract,
        address _root_db
    ) {
        TORN_CONTRACT = _tornContract;
        ROOT_DB = _root_db;
    }

    /** ---------- modifier ---------- **/
    modifier onlyOperator() {
        require(msg.sender == RootDB(ROOT_DB).operator(), "Caller is not operator");
        _;
    }


    event distribute_torn(address,uint256);
    function distributeTorn(uint256 _amount) external onlyOperator {
        //require(IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this)) >= _amount, 'Insufficient balance');
        address _depositAddress = RootDB(ROOT_DB).depositContract();
        //require(_depositAddress != address(0), 'Invalid deposit address');
        RootDB(ROOT_DB).addIncome(_amount);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(TORN_CONTRACT),_depositAddress, _amount);
        emit distribute_torn(_depositAddress,_amount);
    }


    receive() external payable {

    }


}
