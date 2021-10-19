import { Cell, HexNumber, Script } from "@ckb-lumos/base";

export interface LumosCell extends Cell{
  output: {
    capacity: HexNumber;
    lock: Script;
    type?: Script;
  };
}