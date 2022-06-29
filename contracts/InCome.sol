// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./RootDB.sol";

contract Income {

    /// the address of  torn ROOT_DB contract
    address immutable public ROOT_DB;
    /// the address of  torn token contract
    address immutable  public TORN_CONTRACT;


    /// @notice An event emitted when operator distribute torn
    /// @param torn: the amount of the TORN distributed
    event distribute_torn(address account, uint256 torn);


    constructor(
        address _torn_contract,
        address _root_db
    ) {
        TORN_CONTRACT = _torn_contract;
        ROOT_DB = _root_db;
    }
    /**
      * @notice addRelayer used to add relayers to the system call by Owner
      * @dev inorder to save gas designed a simple algorithm to manger the relayers
             it is not perfect
      * @param relayer address of relayers
                address can only added once
      * @param  index  of relayer
   **/
    function distributeTorn(uint256 qty) {
        address deposit_address = RootDB(ROOT_DB).depositContract();
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(TORN_CONTRACT), deposit_address, qty);
        emit distribute_torn(qty);
    }

    receive() external payable {

    }

}
