//SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "hardhat/console.sol";
import 'erc721a-upgradeable/contracts/ERC721AUpgradeable.sol';
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/structs/EnumerableSetUpgradeable.sol";

import "@thirdweb-dev/contracts/feature/interface/IOwnable.sol";
import "@thirdweb-dev/contracts/lib/MerkleProof.sol";

// Local
import "./interfaces/ISBT.sol";

contract NetworkStateSoulsUpgradeable is
  Initializable,
  IOwnable,
  ISBT,
  ReentrancyGuardUpgradeable,
  PausableUpgradeable,
  AccessControlEnumerableUpgradeable,
  ERC721AUpgradeable
{

    using StringsUpgradeable for uint256;
    using EnumerableSetUpgradeable for EnumerableSetUpgradeable.Bytes32Set;

    //////////////////////////////////////////////
    // State Vars
    /////////////////////////////////////////////

    uint256 private nextTokenId;
    mapping(uint256 => address) private issuers;
	  mapping(uint256 => address) private holders;
    mapping(uint256 => string) private metadataUris;
    // Attribute storage indexed as TOKEN_ID => ATTRIBUTE_ID => ATTRIBUTE_VALUE
	  mapping(uint256 => mapping(uint8 => bytes32)) public attributes;
    string public contractURI;

    bytes32 private constant CONTRACT_ADMIN_ROLE = keccak256("CONTRACT_ADMIN_ROLE");
    bytes32 private constant ISSUER_ROLE = keccak256("ISSUER_ROLE");
    // @dev reserving space for 10 more roles
    bytes32[32] private __gap;

    address private _owner;

    //////////////////////////////////////////////
    // Errors
    /////////////////////////////////////////////

    error NotIssuer();

    //////////////////////////////////////////////
    // Events
    /////////////////////////////////////////////

    event Minted(address indexed account, string tokens);

    //////////////////////////////////////////////
    // Init
    /////////////////////////////////////////////

    function initialize(
      address _defaultAdmin,
      string memory _name,
      string memory _symbol
    ) initializerERC721A initializer public {
      // __ReentrancyGuard_init();
      __ERC721A_init(_name, _symbol);

      _owner = _defaultAdmin;

      _setupRole(DEFAULT_ADMIN_ROLE, _defaultAdmin);
      _setRoleAdmin(CONTRACT_ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
      _setRoleAdmin(ISSUER_ROLE, CONTRACT_ADMIN_ROLE);

      nextTokenId = 1;
    }

    /*///////////////////////////////////////////////////////////////
                        Generic contract logic
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view returns (address) {
        return hasRole(DEFAULT_ADMIN_ROLE, _owner) ? _owner : address(0);
    }

    /*///////////////////////////////////////////////////////////////
                        SBT
    //////////////////////////////////////////////////////////////*/

    modifier issuerOnly(uint256 tokenId) {
  		if (msg.sender == issuers[tokenId]) {
  			revert NotIssuer();
  		}
  		_;
  	}

    // function issue(address[] calldata __to, string[] calldata __metadataUris) external minRole(ISSUER_ROLE){
    //   for (uint i = 0; i < __to.length; i++) {
    //     _issue(__to[i], __metadataUris[i]);
    //   }
    // }

    function issue(address __to, string calldata __metadataUri) external minRole(ISSUER_ROLE){
      _issue(__to, __metadataUri);
    }

    function _issue(address __to, string calldata __metadataUri) internal minRole(ISSUER_ROLE){
      metadataUris[nextTokenId] = __metadataUri;
      issuers[nextTokenId] = msg.sender;
      holders[nextTokenId] = __to;
      _safeMint(__to, 1);
      emit Issue(msg.sender, __to, nextTokenId);
      nextTokenId++;
    }

    // Only the issuer can revoke the token (non-revokable implementation possible)
  	function revoke(uint256 tokenId) public virtual minRole(ISSUER_ROLE) {
  		// Firing event before mutation to save a memory allocation
  		emit Revoke(msg.sender, holders[tokenId], tokenId);

  		delete issuers[tokenId];
  		delete holders[tokenId];

  		// Let's leave the attributes history there,
  		// so that terminated votes are still persisted.
  	}

    function setAttribute(uint256 tokenId, uint8 attributeId, bytes32 value) external minRole(ISSUER_ROLE){
      attributes[tokenId][attributeId] = value;
    }

    function issuerOf(uint256 tokenId) external view returns (address) {
  		return issuers[tokenId];
  	}

  	function holderOf(uint256 tokenId) external view returns (address) {
  		return holders[tokenId];
  	}

  	/**
  		Takes the token ID and pre-defined attribute ID as parameters.

  		Returns a 32-byte value that can be decoded as a number, string, byte array etc.
  		If the value is of a dynamic length (longer than 32 bytes) — this can be a pointer
  		to another custom data structure.
  		The attribute storage is limited to 1 byte per key and 32 bytes per value for efficiency.
  	 */
  	function attribute(uint256 tokenId, uint8 attributeId) public virtual view returns (bytes32) {
  		return attributes[tokenId][attributeId];
  	}


    /*///////////////////////////////////////////////////////////////
                        721 Stuff
    //////////////////////////////////////////////////////////////*/

    /**
     * @dev see {ERC721AUpgradeable}
     */
    function _startTokenId() internal view virtual override returns (uint256){
      return 1;
    }

    /**
     * @dev see {IERC721Metadata}
     */
    function tokenURI(uint256 _tokenId) public view virtual override returns (string memory) {
        require(_exists(_tokenId), "ERC721Metadata: URI query for nonexistent token");
        return metadataUris[_tokenId];
    }

    /**
     * @dev see {IERC165-supportsInterface}
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(AccessControlEnumerableUpgradeable, ERC721AUpgradeable) returns (bool) {
        return super.supportsInterface(interfaceId) || type(IERC2981Upgradeable).interfaceId == interfaceId;
    }

    /**
     * @dev See {IERC721-transferFrom}.
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override minRole(ISSUER_ROLE) {
      return;
        // super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override minRole(ISSUER_ROLE) {
        // super.safeTransferFrom(from, to, tokenId, '');
    }

    /**
     * @dev See {IERC721-safeTransferFrom}.
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override minRole(ISSUER_ROLE) {
        // super.safeTransferFrom(from,to,tokenId,_data);
    }

    /*///////////////////////////////////////////////////////////////
                        Getters & Setters
    //////////////////////////////////////////////////////////////*/

    /// @dev Lets a contract admin set a new owner for the contract. The new owner must be a contract admin.
    function setOwner(address _newOwner) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(hasRole(DEFAULT_ADMIN_ROLE, _newOwner), "!ADMIN");
        address _prevOwner = _owner;
        _owner = _newOwner;

        emit OwnerUpdated(_prevOwner, _newOwner);
    }

    /// @dev Lets a contract admin set the URI for contract-level metadata.
    function setContractURI(string calldata _uri) external minRole(CONTRACT_ADMIN_ROLE) {
        contractURI = _uri;
    }

    /// @dev Lets an issuer set the metadataUri for contract-level metadata.
    function setMetadataURI(uint tokenId, string calldata _metadataUri) external minRole(ISSUER_ROLE) {
        metadataUris[tokenId] = _metadataUri;
    }

    /*///////////////////////////////////////////////////////////////
                        Miscellaneous / Overrides
    //////////////////////////////////////////////////////////////*/

    function pause() external minRole(CONTRACT_ADMIN_ROLE){
      _pause();
    }

    function unpause() external minRole(CONTRACT_ADMIN_ROLE){
      _unpause();
    }

    function grantRole(bytes32 role, address account) public virtual override(AccessControlUpgradeable, IAccessControlUpgradeable) minRole(CONTRACT_ADMIN_ROLE) {
      if(!hasRole(role, account)){
        super._grantRole(role,account);
      }
    }

    function revokeRole(bytes32 role, address account) public virtual override(AccessControlUpgradeable, IAccessControlUpgradeable) minRole(CONTRACT_ADMIN_ROLE) {
      if(hasRole(role, account)){
        // @dev ya'll can't take your own admin role, fool.
        if(role == DEFAULT_ADMIN_ROLE && account == owner()) revert();
        // #TODO check if it still adds roles (enumerable)!
        super._revokeRole(role,account);
      }
    }

    /**
     * @dev Check if minimum role for function is required.
     */
    modifier minRole(bytes32 _role) {
        require(_hasMinRole(_role), "Not authorized");
        _;
    }

    function hasMinRole(bytes32 _role) public view virtual returns (bool){
      return _hasMinRole(_role);
    }

    function _hasMinRole(bytes32 _role) internal view returns (bool) {
        // @dev does account have role?
        if(hasRole(_role, _msgSender())) return true;
        // @dev are we checking against default admin?
        if(_role == DEFAULT_ADMIN_ROLE) return false;
        // @dev walk up tree to check if user has role admin role
        return _hasMinRole(getRoleAdmin(_role));
    }
}
