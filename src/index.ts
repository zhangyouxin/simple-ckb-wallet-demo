import { Transferer } from './transferer';
import { getBalanceByLock } from './ckbCells';
import { ALICE, BOB } from './accounts';
import { Script } from '@ckb-lumos/base';
import { parseAddress } from '@ckb-lumos/helpers'
import { initializeConfig } from '@ckb-lumos/config-manager';

initializeConfig()

// const aliceLock: Script = parseAddress(ALICE.ADDRESS);
// getBalanceByLock(aliceLock).then(console.log)

const main = async () => {
  const transferer = new Transferer('https://testnet.ckb.dev', 'https://testnet.ckb.dev/indexer')
  let balanceA = await transferer.getBalance(ALICE.ADDRESS, '')
  console.log('alice\'s balance is:', balanceA);
  let balanceB = await transferer.getBalance(BOB.ADDRESS, '')
  console.log('bob\'s balance is:', balanceB);

  await transferer.commonTransfer([ALICE.ADDRESS], BOB.ADDRESS, 20000000000n, 10000000n, ALICE.PRIVATE_KEY);
  balanceA = await transferer.getBalance(ALICE.ADDRESS, '')
  console.log('alice\'s balance is:', balanceA);
  balanceB = await transferer.getBalance(BOB.ADDRESS, '')
  console.log('bob\'s balance is:', balanceB);

  // 以下代码交易签名有问题，正在开发中...
  // const unsignedTx = await transferer.transfer( parseAddress(ALICE.ADDRESS), BOB.ADDRESS, 100000000n)
  // const transferTxHash = await transferer.signAndSendTransaction(
  //   unsignedTx,
  //   ALICE.PRIVATE_KEY
  // );
  // console.log('tx hash is: ', transferTxHash)
}

main()