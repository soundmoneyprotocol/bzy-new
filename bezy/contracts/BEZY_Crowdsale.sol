pragma solidity ^0.5.0;

import "@openzeppelin/upgrades/contracts/Initializable.sol";

import "@openzeppelin/contracts-ethereum-package/contracts/crowdsale/Crowdsale.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/crowdsale/emission/MintedCrowdsale.sol";

contract BezyCrowdsale is Initializable, Crowdsale, MintedCrowdsale, AllowanceCrowdsale, TimedCrowdsale, PostDeliveryCrowdsale {

    constructor(
        uint256 rate,            // rate, in TKNbits
        address payable wallet,  // wallet to send Ether
        IERC20 token,            // the token
        uint256 openingTime,     // opening time in unix epoch seconds
        uint256 closingTime      // closing time in unix epoch seconds
        address tokenWallet  // <- new argument
    )
        AllowanceCrowdsale(tokenWallet)  // <- used here
        PostDeliveryCrowdsale()
        TimedCrowdsale(openingTime, closingTime)
        Crowdsale(rate, wallet, token)
        public
    {
        // nice! this Crowdsale will keep all of the tokens until the end of the crowdsale
        // and then users can `withdrawTokens()` to get the tokens they're owed
        function initialize(
            uint256 rate,    
            // rate in TKNbits
            address payable wallet,
            IERC20 token
        ) public initializer {
            Crowdsale.initialize(rate, wallet, token);
        }
    }
    contract BezyCrowdsaleDeployer {
        constructor()
            public
        {
            // create a mintable token
            ERC20Mintable token = new BezyCoin();
    
            // create the crowdsale and tell it about the token
            Crowdsale crowdsale = new BezyCrowdsale(
                1,               // rate, still in TKNbits
                msg.sender,      // send Ether to the deployer
                token            // the token
            );
            // transfer the minter role from this contract (the default)
            // to the crowdsale, so it can mint tokens
            token.addMinter(address(crowdsale));
            token.renounceMinter();
        }
    }
    }
    


