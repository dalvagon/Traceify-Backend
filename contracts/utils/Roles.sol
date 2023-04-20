// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Roles is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    struct ManagerRequest {
        uint256 timestamp;
        bytes32 ipfsRequestHash;
        bool approved;
    }
    mapping(address => ManagerRequest) public managerRequests;
    address[] public managerRequestAddresses;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function submitManagerRequest(bytes32 ipfsRequestHash) external {
        require(
            managerRequests[msg.sender].timestamp == 0,
            "Manager request already submitted"
        );

        ManagerRequest memory managerRequest = ManagerRequest({
            timestamp: block.timestamp,
            ipfsRequestHash: ipfsRequestHash,
            approved: false
        });

        managerRequests[msg.sender] = managerRequest;
        managerRequestAddresses.push(msg.sender);
    }

    function approveManagerRequest(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            hasRole(MANAGER_ROLE, account) == false,
            "Account is already a manager"
        );
        require(
            managerRequests[account].timestamp != 0,
            "Manager request does not exist"
        );

        _addManager(account);

        managerRequests[account].approved = true;
    }

    function denyManagerRequest(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            managerRequests[account].timestamp != 0,
            "Manager request does not exist"
        );
        require(
            managerRequests[account].approved == false,
            "Manager request already approved"
        );

        delete managerRequests[account];
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
                managerRequests[managerRequestAddresses[i]].approved == false &&
                managerRequests[managerRequestAddresses[i]].timestamp != 0
            ) {
                addresses[index] = managerRequestAddresses[i];
                index++;
            }
        }

        return addresses;
    }

    function getApprovedManagerRequestsAddresses()
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address[] memory)
    {
        uint256 length = getNumberOfApprovedManagerRequests();
        address[] memory addresses = new address[](length);
        uint256 index = 0;

        for (uint256 i = 0; i < managerRequestAddresses.length; i++) {
            if (managerRequests[managerRequestAddresses[i]].approved == true) {
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
            managerRequests[account].ipfsRequestHash,
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
            if (managerRequests[managerRequestAddresses[i]].approved == true) {
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
                managerRequests[managerRequestAddresses[i]].approved == false &&
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
