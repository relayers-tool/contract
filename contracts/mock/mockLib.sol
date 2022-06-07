import "hardhat/console.sol";

library mockLib{

    function getDecimals(uint256 coinType ) internal returns(uint256) {
        if(coinType == 0){
            return uint256(18);
        }else if(coinType == 1){
            return uint256(6);
        }
        else if(coinType == 2){
            return uint256(18);
        }
        require(false,"err");
        return uint256(0);
    }


    function checkValue(string memory coinType ,uint256 value ) internal returns(bool) {
         uint256 decimals = getDecimals( coin2Index(coinType));

         return (value == uint256(10)**decimals || value == uint256(10)*(10**decimals) || value == uint256(100)*(10**decimals)
         || value == uint256(1000)*(10**decimals)|| value == uint256(10000)*(10**decimals));
    }
    function coin2Index(string memory coinType) internal pure returns(uint256){
         if(strcmp(coinType,"eth")){
             return 0;
         }else if(strcmp(coinType,"usdc")){
             return 1;
         }
         else if(strcmp(coinType,"dai")){
             return 2;
         }
            require(false,"");
            return 0;

        }

    function memcmp(bytes memory a, bytes memory b) internal pure returns(bool){
        return (a.length == b.length) && (keccak256(a) == keccak256(b));
    }
    function strcmp(string memory a, string memory b) internal pure returns(bool){
        return memcmp(bytes(a), bytes(b));
    }
}
