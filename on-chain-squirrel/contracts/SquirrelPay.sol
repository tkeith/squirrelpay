// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";


contract SquirrelFractionalAttestationToken is ERC20 {
  SquirrelPay public squirrelPay;
  uint256 public batchId;

  constructor(SquirrelPay _squirrelPay, uint256 _batchId, uint256 _supply) ERC20(string.concat("SquirrelPay Batch ", Strings.toString(_batchId)), "SFAT") {
    squirrelPay = _squirrelPay;
    batchId = _batchId;
    _mint(msg.sender, _supply);
  }

  function _beforeTokenTransfer(address, address, uint256) internal view override {
    require(msg.sender == address(squirrelPay), "Only SquirrelPay can transfer SquirrelFractionalAttestationToken");
  }
}

contract SquirrelPay {
  struct Batch {
    uint256 batchId;
    SquirrelFractionalAttestationToken squirrelFractionalAttestationToken;
    string attestation;
    uint256 totalAmount;
    uint256 unwithdrawnAmount;
  }

  uint256 numberOfBatches = 0;
  mapping(uint256 => Batch) public batches;
  mapping(uint256 => mapping(address => uint256)) public beneficiaryBalance;

  event Deposit(uint256 batchId, string attestation, uint256 amount);

  event AttestedWithdrawal(uint256 batchId, address receiver, uint256 amount, string attestation, string meta);

  event PrivateWithdrawal(uint256 batchId, address receiver, uint256 amount, string meta);

  ERC20 constant sDAI = ERC20(0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063);

  constructor() {}

  function deposit(string calldata _attestation, uint256 _amount) external {
    numberOfBatches += 1;
    sDAI.transferFrom(msg.sender, address(this), _amount);
    SquirrelFractionalAttestationToken token = new SquirrelFractionalAttestationToken(this, numberOfBatches, _amount);
    batches[numberOfBatches] = Batch(numberOfBatches, token, _attestation, _amount, _amount);
    beneficiaryBalance[numberOfBatches][msg.sender] = _amount;
    emit Deposit(numberOfBatches, _attestation, _amount);
  }

  // TODO: this function should be a ZK-privacy-preserving mixer transaction
  function transferBeneficialOwnership(uint256 _batchId, address _to, uint256 _amount) external {
    require(beneficiaryBalance[_batchId][msg.sender] >= _amount, "Insufficient balance");
    beneficiaryBalance[_batchId][msg.sender] -= _amount;
    beneficiaryBalance[_batchId][_to] += _amount;
  }

  function withdrawWithAttestation(uint256 _batchId, uint256 _amount, string calldata _meta) external {
    require(beneficiaryBalance[_batchId][msg.sender] >= _amount, "Insufficient balance");
    beneficiaryBalance[_batchId][msg.sender] -= _amount;
    batches[_batchId].unwithdrawnAmount -= _amount;
    sDAI.transfer(msg.sender, _amount);
    batches[_batchId].squirrelFractionalAttestationToken.transfer(msg.sender, _amount);
    emit AttestedWithdrawal(_batchId, msg.sender, _amount, batches[_batchId].attestation, _meta);
  }

  function withdrawPrivately(uint256 _batchId, uint256 _amount, string calldata _meta) external {
    require(beneficiaryBalance[_batchId][msg.sender] >= _amount, "Insufficient balance");
    beneficiaryBalance[_batchId][msg.sender] -= _amount;
    batches[_batchId].unwithdrawnAmount -= _amount;
    sDAI.transfer(msg.sender, _amount);
    emit PrivateWithdrawal(_batchId, msg.sender, _amount, _meta);
  }

}
