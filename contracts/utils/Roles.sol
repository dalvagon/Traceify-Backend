// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./Utils.sol";

contract Roles is AccessControl, Utils {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    struct ManagerRequest {
        uint256 timestamp;
        bytes32 ipfsHash;
        bool approved;
    }

    mapping(address => ManagerRequest) public managerRequests;
    address[] public managerRequestAddresses;

    event ManagerRequestSubmitted(address indexed account);
    event ManagerRequestApproved(address indexed account);
    event ManagerRequestDenied(address indexed account);

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function submitManagerRequest(bytes32 ipfsHash) external {
        require(
            managerRequests[msg.sender].ipfsHash == 0,
            "Manager request already submitted"
        );

        ManagerRequest memory managerRequest = ManagerRequest({
            timestamp: block.timestamp,
            ipfsHash: ipfsHash,
            approved: false
        });

        managerRequests[msg.sender] = managerRequest;
        managerRequestAddresses.push(msg.sender);

        emit ManagerRequestSubmitted(msg.sender);
    }

    function approveManagerRequest(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            !hasRole(MANAGER_ROLE, account),
            "Manager request already approved"
        );
        require(
            managerRequests[account].timestamp != 0,
            "This user has not submitted a request"
        );

        _addManager(account);
        managerRequests[account].approved = true;

        emit ManagerRequestApproved(account);
    }

    function rejectManagerRequest(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            managerRequests[account].timestamp != 0,
            "This user has not submitted a request"
        );

        delete managerRequests[account];

        emit ManagerRequestDenied(account);
    }

    function getManagerRequestAddresses()
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address[] memory)
    {
        uint256 length = getNumberOfUnapprovedManagerRequests();
        address[] memory addresses = new address[](length);
        uint256 index = 0;

        for (uint256 i = 0; i < managerRequestAddresses.length; i++) {
            if (
                !managerRequests[managerRequestAddresses[i]].approved &&
                managerRequests[managerRequestAddresses[i]].timestamp != 0
            ) {
                addresses[index] = managerRequestAddresses[i];
                index++;
            }
        }

        return addresses;
    }

    function getApprovedManagerRequestAddresses()
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address[] memory)
    {
        uint256 length = getNumberOfApprovedManagerRequests();
        address[] memory addresses = new address[](length);
        uint256 index = 0;

        for (uint256 i = 0; i < managerRequestAddresses.length; i++) {
            if (managerRequests[managerRequestAddresses[i]].approved) {
                addresses[index] = managerRequestAddresses[i];
                index++;
            }
        }

        return addresses;
    }

    function getManagerRequest(
        address account
    )
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address, bytes32, uint256)
    {
        return (
            account,
            managerRequests[account].ipfsHash,
            managerRequests[account].timestamp
        );
    }

    function getNumberOfApprovedManagerRequests()
        internal
        view
        returns (uint256)
    {
        uint256 length = 0;

        for (uint256 i = 0; i < managerRequestAddresses.length; i++) {
            if (managerRequests[managerRequestAddresses[i]].approved) {
                length++;
            }
        }

        return length;
    }

    function getNumberOfUnapprovedManagerRequests()
        internal
        view
        returns (uint256)
    {
        uint256 length = 0;

        for (uint256 i = 0; i < managerRequestAddresses.length; i++) {
            if (
                !managerRequests[managerRequestAddresses[i]].approved &&
                managerRequests[managerRequestAddresses[i]].timestamp != 0
            ) {
                length++;
            }
        }

        return length;
    }

    function _addManager(address account) internal {
        grantRole(MANAGER_ROLE, account);
    }
}
