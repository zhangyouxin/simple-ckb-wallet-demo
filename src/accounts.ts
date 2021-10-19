import { HexString, Script } from "@ckb-lumos/base";
import { getConfig } from "@ckb-lumos/config-manager";

function lockScript(pubkeyHash: HexString): Script {
  return {
    code_hash: getConfig().SCRIPTS!.SECP256K1_BLAKE160!.CODE_HASH,
    hash_type: getConfig().SCRIPTS!.SECP256K1_BLAKE160!.HASH_TYPE,
    args: pubkeyHash,
  };
}

export const ALICE = {
  PRIVATE_KEY:
    "0x4a2b82f8a71fd51bbe0225e94dd9a25a7173169e2eb136115583c0a8495e0c7a",
  ADDRESS: "ckt1qyqxn59qn8xx4zd8p6mu4xtf4lz94zf2vfwsjaffax",
  ARGS: "0x69d0a099cc6a89a70eb7ca9969afc45a892a625d",
};

export const BOB = {
  PRIVATE_KEY:
    "0xb12c5d587aef846f2e6031d5c73d169db7e434441cfd11c185207d6b8b71aabb",
  ADDRESS: "ckt1qyq2s4ucect2avjymfvf272hry4fyrutdg5s7808wh",
  ARGS: "0xa85798ce16aeb244da58957957192a920f8b6a29",
};
