import { Script } from '@ckb-lumos/base';
import { getCellsByLock } from './api';
import { LumosCell } from './ckb';

export const getBalanceByLock = (lock: Script):Promise<BigInt> => {
  return getCellsByLock(lock).then((res: any) => {
    const liveCells: LumosCell[] = res.data!.result!.objects || []
    // console.log(liveCells);
    return liveCells.reduce((a: any, c: any) => (a + BigInt(c.output.capacity)), BigInt(0))
  })
}