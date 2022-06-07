pragma solidity ^0.8.0;

import "../Interface/ISwapRouter.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract MockSwap {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address immutable public WETH;


    /** ---------- constructor ---------- **/
    constructor(
        address _weth
    ) {
        WETH = _weth;
    }

    function exactInputSingle(ISwapRouter.ExactInputSingleParams calldata params) external payable returns (uint256 amountOut) {
        bool transferIn = true;
        if (params.tokenIn == WETH && msg.value > 0) {
            transferIn = false;
            require(msg.value == params.amountIn);
        }
        if (transferIn) {
            IERC20Upgradeable(params.tokenIn).safeTransferFrom(msg.sender, address(this), params.amountIn);
        }

        amountOut = params.amountOutMinimum;
        IERC20Upgradeable(params.tokenOut).safeTransfer(msg.sender, params.amountOutMinimum);
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
