// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./RootDB.sol";

contract Income {

    address immutable public TORN_CONTRACT;
    address immutable public ROOT_DB;

    event distribute_torn(address, uint256);


    constructor(
        address _torn_contract,
        address _root_db
    ) {
        TORN_CONTRACT = _torn_contract;
        ROOT_DB = _root_db;
    }

    modifier onlyOperator() {
        require(msg.sender == RootDB(ROOT_DB).operator(), "Caller is not operator");
        _;
    }


    function distributeTorn(uint256 qty) external onlyOperator {
        address deposit_address = RootDB(ROOT_DB).depositContract();
        RootDB(ROOT_DB).addIncome(qty);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(TORN_CONTRACT), deposit_address, qty);
        emit distribute_torn(deposit_address, qty);
    }

    receive() external payable {

    }

}
