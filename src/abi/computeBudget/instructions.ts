import { binary, fixedArray, struct, u128, u32, u64, u8 } from "@subsquid/borsh";
import { instruction } from "../abi.support";

export const setComputeUnitLimit = instruction(
  {
    d1: "0x02",
  },
  {},
  struct({
    units: u32,
  })
);

export const setComputeUnitPrice = instruction(
  {
    d1: "0x03",
  },
  {},
  struct({
    microLamports: u64,
  })
);
