import base58 from "bs58";
import { Base58Bytes } from "@subsquid/borsh/lib/type-util";

export class SrcCustom {
  private view: DataView;
  private pos = 0;

  constructor(private buf: Uint8Array) {
    this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  }

  u8(): number {
    let val = this.view.getUint8(this.pos);
    this.pos += 1;
    return val;
  }

  i8(): number {
    let val = this.view.getInt8(this.pos);
    this.pos += 1;
    return val;
  }

  u16(): number {
    let val = this.view.getUint16(this.pos, true);
    this.pos += 2;
    return val;
  }

  i16(): number {
    let val = this.view.getInt16(this.pos, true);
    this.pos += 2;
    return val;
  }

  u32(): number {
    let val = this.view.getUint32(this.pos, true);
    this.pos += 4;
    return val;
  }

  i32(): number {
    let val = this.view.getInt32(this.pos, true);
    this.pos += 4;
    return val;
  }

  u64(): bigint {
    let val = this.view.getBigUint64(this.pos, true);
    this.pos += 8;
    return val;
  }

  i64(): bigint {
    let val = this.view.getBigInt64(this.pos, true);
    this.pos += 8;
    return val;
  }

  u128(): bigint {
    let lo = this.u64();
    let hi = this.u64();
    return lo + (hi << 64n);
  }

  u256(): bigint {
    let p1 = this.u64();
    let p2 = this.u64();
    let p3 = this.u64();
    let p4 = this.u64();
    return p1 + (p2 << 64n) + (p3 << 128n) + (p4 << 192n);
  }

  i128(): bigint {
    let lo = this.u64();
    let hi = this.i64();
    return lo + (hi << 64n);
  }

  f32(): number {
    let val = this.view.getFloat32(this.pos, true);
    this.pos += 4;
    return val;
  }

  f64(): number {
    let val = this.view.getFloat64(this.pos, true);
    this.pos += 8;
    return val;
  }

  bytes(len: number): Uint8Array {
    this.assertLength(len);
    let val = this.buf.subarray(this.pos, this.pos + len);
    this.pos += len;
    return val;
  }

  base58(len: number): Base58Bytes {
    return base58.encode(this.bytes(len));
  }

  string(): string {
    let len = this.u32();
    this.assertLength(len);
    let val = Buffer.from(this.buf.buffer, this.buf.byteOffset + this.pos, len).toString("utf-8");
    this.pos += len;
    return val;
  }

  bool(): boolean {
    return !!this.u8();
  }

  private assertLength(len: number): void {
    if (this.buf.length - this.pos < len) {
      throw new RangeError("Unexpected end of input");
    }
  }
}

export function convertByteArrayToHex(bytes: number[]) {
  return "0x" + Buffer.from(bytes).toString("hex");
}
