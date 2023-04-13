// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Roles is AccessControl {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    struct ManagerRequest {
        uint256 timestamp;
        string name;
        string email;
        string company;
        string purpose;
    }
    address[] public managerRequestAddresses;
    mapping(address => ManagerRequest) public managerRequests;

    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function submitManagerRequest(
        string calldata name,
        string calldata email,
        string calldata company,
        string calldata purpose
    ) external {
        require(
            managerRequests[msg.sender].timestamp == 0,
            "Manager request already submitted"
        );

        ManagerRequest memory managerRequest = ManagerRequest({
            timestamp: block.timestamp,
            name: name,
            email: email,
            company: company,
            purpose: purpose
        });

        managerRequestAddresses.push(msg.sender);
        managerRequests[msg.sender] = managerRequest;
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

        delete managerRequests[account];
    }

    function denyManagerRequest(
        address account
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(
            managerRequests[account].timestamp != 0,
            "Manager request does not exist"
        );

        delete managerRequests[account];
    }

    function getManagerRequestAddresses()
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (address[] memory)
    {
        return managerRequestAddresses;
    }

    function getManagerRequest(
        address account
    )
        external
        view
        onlyRole(DEFAULT_ADMIN_ROLE)
        returns (string memory, string memory, string memory, string memory)
    {
        return (
            managerRequests[account].name,
            managerRequests[account].email,
            managerRequests[account].company,
            managerRequests[account].purpose
        );
    }

    function _addManager(
        address account
    ) internal onlyRole(DEFAULT_ADMIN_ROLE) {
        grantRole(MANAGER_ROLE, account);
    }
}
