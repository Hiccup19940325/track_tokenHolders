import {
  Transfer as TransferEvent,
  StakingToken,
} from "../generated/StakingToken/StakingToken"
import { Transfer, TokenHolder } from "../generated/schema"
import { Address, BigInt, log } from "@graphprotocol/graph-ts"


export function handleTransfer(event: TransferEvent): void {
  let entity = new Transfer(
    event.transaction.hash.concatI32(event.logIndex.toI32())
  )
  entity.from = event.params.from
  entity.to = event.params.to
  entity.value = event.params.value

  entity.blockNumber = event.block.number
  entity.blockTimestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash

  entity.save()

  let contract = StakingToken.bind(event.address as Address)

  let fromAddress = event.params.from;
  let fromInfo = TokenHolder.load(fromAddress);
  if (fromInfo == null) {
    fromInfo = new TokenHolder(fromAddress);
    fromInfo.balance = contract.balanceOf(fromAddress)
    fromInfo.save();
  }

  else {
    fromInfo.balance = fromInfo.balance - event.params.value;
    fromInfo.save();
  }

  let toAddress = event.params.to;
  let toInfo = TokenHolder.load(toAddress);
  if (toInfo == null) {
    toInfo = new TokenHolder(toAddress);
    toInfo.balance = contract.balanceOf(toAddress)
    toInfo.save();
  }

  else {
    toInfo.balance = toInfo.balance + event.params.value;
    toInfo.save();
  }
}
