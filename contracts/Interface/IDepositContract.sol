pragma solidity ^0.8.0;

interface IDepositContract {
    function totalBalanceOfTorn() external view returns (uint256);
    function checkRewardOnGov() external view returns (uint256);
    function withDrawWithApproval(uint256 _amount) external ;
    function withdraw_for_exit(uint256 _amount_token) external  returns (uint256);
}
