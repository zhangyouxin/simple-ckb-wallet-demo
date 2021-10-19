import { Script } from "@ckb-lumos/base";
const axios = require("axios").default;
const CKB_INDEXER_BASE_URL = "https://testnet.ckb.dev";
const CKB_INDEXER_URL = "/indexer";

export const api = axios.create({
  baseURL: CKB_INDEXER_BASE_URL,
  timeout: 30000,
  headers: { "content-type": "application/json" },
});

export const getTip = () => {
  return api.post(CKB_INDEXER_URL, {
    id: 2,
    jsonrpc: "2.0",
    method: "get_tip",
  });
};
export const getCellsByLock = (lock: Script) => {
  return api.post(CKB_INDEXER_URL, {
    id: 2,
    jsonrpc: "2.0",
    method: "get_cells",
    params: [
      {
        script: lock,
        script_type: "lock",
      },
      "asc",
      "0x64",
    ],
  });
};
