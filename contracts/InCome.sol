pragma solidity ^0.8.0;

import "./Interface/IRootManger.sol";
import "./Interface/ISwapRouter.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "./Interface/IinComeContract.sol";

contract Income is IinComeContract {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address immutable public WETH;
    address immutable public SWAP_ROUTE;
    address immutable public TORN_CONTRACT;
    address immutable public ROOT_MANAGER;


    /** ---------- constructor ---------- **/
    constructor(
        address _swapRoute,
        address _weth,
        address _tornContract,
        address _root_manager
    ) {
        SWAP_ROUTE = _swapRoute;
        WETH = _weth;
        TORN_CONTRACT = _tornContract;
        ROOT_MANAGER = _root_manager;
    }

    /** ---------- modifier ---------- **/
    modifier onlyOperator() {
        require(msg.sender == IRootManger(ROOT_MANAGER).operator(), "Caller is not operator");
        _;
    }


    event with_draw(address, address,uint256);
    function withdraw(address _token, uint256 _amount) external payable onlyOperator {

        emit with_draw(_token,msg.sender,_amount);

        if (_token == address(0)) {
            require(address(this).balance >= _amount, 'Insufficient balance');
            AddressUpgradeable.sendValue(payable(msg.sender), _amount);
        } else {
            //require(IERC20Upgradeable(_token).balanceOf(address(this)) >= _amount, 'Insufficient balance');
            IERC20Upgradeable(_token).safeTransfer(msg.sender, _amount);
        }
    }


    function swapETHForTorn(uint256 _amount, uint256 _minAmountOut) external payable onlyOperator {
       require(msg.value == _amount, "unconformity value");
        ISwapRouter(SWAP_ROUTE).exactInputSingle{value: _amount}(ISwapRouter.ExactInputSingleParams({
            tokenIn: WETH,
            tokenOut: TORN_CONTRACT,
            fee: 10000,
            recipient: address(this),
            deadline: block.timestamp + 60,
            amountIn: _amount,
            amountOutMinimum: _minAmountOut,
            sqrtPriceLimitX96: 0
        }));
    }

    event distribute_torn(address,uint256);
    function distributeTorn(uint256 _amount) external onlyOperator {
        //require(IERC20Upgradeable(TORN_CONTRACT).balanceOf(address(this)) >= _amount, 'Insufficient balance');
        address _depositAddress = IRootManger(ROOT_MANAGER).depositContract();
        //require(_depositAddress != address(0), 'Invalid deposit address');
        IRootManger(ROOT_MANAGER).addIncome(_amount);
        SafeERC20Upgradeable.safeTransfer(IERC20Upgradeable(TORN_CONTRACT),_depositAddress, _amount);
        emit distribute_torn(_depositAddress,_amount);
    }


    event received(address, uint);
    receive() external payable {
        emit received(msg.sender, msg.value);
    }

    event called_fallback(address, uint);
    fallback() external payable {
        emit called_fallback(msg.sender, msg.value);
    }
}
