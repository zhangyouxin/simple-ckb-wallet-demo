import { CkbTxHelper } from "./helper/generator";
import {
  sealTransaction,
  minimalCellCapacity,
  parseAddress,
  scriptToAddress,
  TransactionSkeleton,
  TransactionSkeletonType,
} from "@ckb-lumos/helpers";
import { Cell, Script, utils, Hash, Transaction } from "@ckb-lumos/base";
import { ScriptType } from "./helper/indexer";
import { common, FromInfo } from "@ckb-lumos/common-scripts";
import { logger } from "./helper/logger";
import { key } from "@ckb-lumos/hd";
import { getConfig } from "@ckb-lumos/config-manager";

export class Transferer extends CkbTxHelper {
  constructor(ckbRpcUrl: string, ckbIndexerUrl: string) {
    super(ckbRpcUrl, ckbIndexerUrl);
  }
  async getBalance(address: string, args: string): Promise<bigint> {
    await this.indexer.waitForSync();
    const userLock = parseAddress(address);
    const searchKey = {
      script: userLock,
      script_type: ScriptType.lock,
    };
    const cells = await this.indexer.getCells(searchKey);
    let balance = 0n;
    cells.forEach((cell) => {
      const amount = BigInt(cell.cell_output.capacity);
      balance += amount;
    });
    return balance;
  }

  /**
   * WIP: 这个方法还在开发中，目前无法生成 witnesses，暂时不要使用
   * @param fromLockscript 
   * @param recipientAddress 
   * @param amount 
   * @returns 
   */
  async transfer(
    fromLockscript: Script,
    recipientAddress: string,
    amount: bigint
  ): Promise<TransactionSkeletonType> {
    const recipient = parseAddress(recipientAddress);
    const fromAddress = scriptToAddress(fromLockscript);
    await this.indexer.waitForSync();
    let txSkeleton = TransactionSkeleton({ cellProvider: this.indexer });

    // add header
    txSkeleton = txSkeleton.update("cellDeps", (cellDeps) => {
      return cellDeps.push({
        out_point: {
          tx_hash: getConfig().SCRIPTS!.SECP256K1_BLAKE160!.TX_HASH,
          index: getConfig().SCRIPTS!.SECP256K1_BLAKE160!.INDEX,
        },
        dep_type: getConfig().SCRIPTS!.SECP256K1_BLAKE160!.DEP_TYPE,
      });
    });
    // collect inputs
    const inputCells = await this.indexer.getCells({
      script: fromLockscript,
      script_type: ScriptType.lock,
    });
    // const inputCells = await this.collector.collectSudtByAmount(
    //   searchKey,
    //   amount
    // );
    // logger.info('input cells:', inputCells)
    // let inputSudtAmount = 0n;
    // inputCells.forEach((cell) => {
    //   const amount = utils.readBigUInt128LE(cell.data);
    //   inputSudtAmount += amount;
    // });
    txSkeleton = txSkeleton.update("inputs", (inputs) => {
      return inputs.concat(inputCells);
    });

    let balance = 0n;
    inputCells.forEach((cell) => {
      const amount = BigInt(cell.cell_output.capacity);
      balance += amount;
    });

    const sudtLeft = balance - amount;
    if (sudtLeft < 0) {
      throw Error(`insufficient sudt, need: ${amount}, have: ${balance}`);
    }
    // add output
    const sudtOutput: Cell = {
      cell_output: {
        capacity: "0x0",
        lock: recipient,
      },
      data: "0x",
    };

    const sudtCellCapacity = minimalCellCapacity(sudtOutput);
    sudtOutput.cell_output.capacity = `0x${sudtCellCapacity.toString(16)}`;
    txSkeleton = txSkeleton.update("outputs", (outputs) => {
      return outputs.push(sudtOutput);
    });
    // add sudt change cell if there is sudt left
    if (sudtLeft > 0) {
      const sudtChangeOutput: Cell = {
        cell_output: {
          capacity: "0x0",
          lock: fromLockscript,
        },
        data: utils.toBigUInt128LE(sudtLeft),
      };
      const sudtChangeCellCapacity = minimalCellCapacity(sudtChangeOutput);
      sudtChangeOutput.cell_output.capacity = `0x${sudtChangeCellCapacity.toString(
        16
      )}`;
      txSkeleton = txSkeleton.update("outputs", (outputs) => {
        return outputs.push(sudtChangeOutput);
      });
    }
    logger.info("txSkeleton before complete:");
    logger.info("inputs0", txSkeleton.get("inputs").get(0));
    logger.info("outputs0", txSkeleton.get("outputs").get(0));
    logger.info("outputs1", txSkeleton.get("outputs").get(1));
    logger.info("outputs2", txSkeleton.get("outputs").get(2));
    logger.info("witnesses", txSkeleton.get("witnesses").get(0));
    // complete tx
    txSkeleton = await this.completeTx(txSkeleton, fromAddress);
    logger.info("txSkeleton after complete:", txSkeleton.get("outputs"));
    logger.info("outputs2", txSkeleton.get("outputs").get(2));
    logger.info("witnesses", txSkeleton.get("witnesses").get(0));

    return txSkeleton;
  }

  async commonTransfer(
    fromInfos: FromInfo[],
    toAddress: string,
    amount: bigint,
    txFee: bigint,
    privateKey: string
  ): Promise<Hash> {
    let txSkeleton: TransactionSkeletonType = TransactionSkeleton({
      cellProvider: this.indexer,
    });
    const tipheader = await this.ckb.get_tip_header();

    txSkeleton = await common.transfer(
      txSkeleton,
      fromInfos,
      toAddress,
      BigInt(amount),
      undefined,
      tipheader
    );

    txSkeleton = await common.payFee(txSkeleton, fromInfos, BigInt(txFee));

    txSkeleton = common.prepareSigningEntries(txSkeleton);
    const tx = await this.signandSeal(txSkeleton, privateKey);
    console.log("The transaction is", tx);
    const hash = await this.ckb.send_transaction(tx);
    console.log("The transaction hash is", hash);
    return hash;
  }

  async signandSeal(
    txskeleton: TransactionSkeletonType,
    privatekey: string
  ): Promise<Transaction> {
    const message = txskeleton.get("signingEntries").get(0)?.message;
    logger.info('tx message is:', message)
    const Sig = key.signRecoverable(message!, privatekey);
    const tx = sealTransaction(txskeleton, [Sig]);
    return tx;
  }
}
