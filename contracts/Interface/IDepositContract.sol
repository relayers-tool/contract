pragma solidity ^0.8.0;

interface IDepositContract {
    function totalBalanceOfTorn() external view returns (uint256);
    function checkRewardOnGov() external view returns (uint256);
    function withDraw(uint256 _amount) external returns (uint256 value);
    function withdraw_for_exit(uint256 _amount_token) external  returns (uint256);
}
