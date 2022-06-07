pragma solidity ^0.8.0;

interface IExitQueue {

    function addQueueWithApproval(uint256 value)  external;
    function  addQueue(uint256 value, uint256 deadline, uint8 v, bytes32 r, bytes32 s) external;
    function  executeQueue() external;
    function  withDraw() external;
    function  cancelQueue() external;
    function nextValue() view external returns(uint256 value);
}
