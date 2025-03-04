import {
  BigIntColumn,
  DateTimeColumn,
  Entity,
  IntColumn,
  PrimaryColumn,
  StringColumn,
  BooleanColumn,
} from "@subsquid/typeorm-store";
import { ManyToOne, OneToMany } from "typeorm";

@Entity()
export class SoonNetworkStatus {
  constructor(props?: Partial<SoonNetworkStatus>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  // transaction count
  @BigIntColumn({ nullable: false })
  txCount!: bigint;

  // address count
  @BigIntColumn({ nullable: false })
  addressCount!: bigint;

  // program count
  @BigIntColumn({ nullable: false })
  programCount!: bigint;
}

@Entity()
export class SoonNetworkTx {
  constructor(props?: Partial<SoonNetworkTx>) {
    Object.assign(this, props);
  }

  // tx hash
  @PrimaryColumn()
  id!: string;

  // sender of the tx
  @StringColumn({ nullable: false })
  sender!: string;

  // compute unit
  @BigIntColumn({ nullable: false })
  computeUnit!: bigint;

  // prioritization gas price, unit is micro lamports
  @BigIntColumn({ nullable: false })
  prioritizationGasPrice!: bigint;

  // tx fee
  @BigIntColumn({ nullable: false })
  fee!: bigint;

  // token transfer in the tx
  @OneToMany(() => TokenTransfer, (ele) => ele.tx)
  tokenTransfer!: bigint;

  // tx hash
  @StringColumn({ nullable: false })
  txHash!: string;

  @BigIntColumn({ nullable: false })
  timestamp!: bigint;

  @IntColumn({ nullable: false })
  blockNumber!: number;
}

@Entity()
export class SoonNetworkUserAddress {
  constructor(props?: Partial<SoonNetworkUserAddress>) {
    Object.assign(this, props);
  }

  // account address
  @PrimaryColumn()
  id!: string;

  // last active timestamp of the address
  @BigIntColumn({ nullable: false })
  lastActiveTimestamp!: bigint;
}

@Entity()
export class SoonNetworkProgram {
  constructor(props?: Partial<SoonNetworkProgram>) {
    Object.assign(this, props);
  }

  // program address
  @PrimaryColumn()
  id!: string;

  // last active timestamp of the program
  @BigIntColumn({ nullable: false })
  lastActiveTimestamp!: bigint;
}

@Entity()
export class TokenTransfer {
  constructor(props?: Partial<TokenTransfer>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  // tx
  @ManyToOne(() => SoonNetworkTx, (ele) => ele.txHash)
  tx!: SoonNetworkTx;

  // previous owner of this token account
  @StringColumn({ nullable: true })
  preOwner!: string;

  // post owner of this token account
  @StringColumn({ nullable: true })
  postOwner!: string;

  // amount before the tx
  @BigIntColumn({ nullable: true })
  preAmount!: bigint;

  // amount after the tx
  @BigIntColumn({ nullable: true })
  postAmount!: bigint;

  // token address
  @StringColumn({ nullable: true })
  mint!: string;
}
