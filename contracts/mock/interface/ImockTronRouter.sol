pragma solidity ^0.8.0;

interface ImockTornRouter {
    function deposit(string memory  coinType,uint256 value) payable external;
    function withdraw(string memory  coinType,uint256 value,address to) external;
}
