import {
  BigIntColumn,
  DateTimeColumn,
  Entity,
  IntColumn,
  PrimaryColumn,
  StringColumn,
  BooleanColumn,
  Column,
} from "@subsquid/typeorm-store";
import { Index, ManyToOne, OneToMany } from "typeorm";

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

  // transaction count for 24 hours
  @BigIntColumn({ nullable: false })
  txCount24Hours!: bigint;

  // address count
  @BigIntColumn({ nullable: false })
  addressCount!: bigint;

  // address count for 24 hours
  @BigIntColumn({ nullable: false })
  addressCount24Hours!: bigint;

  // address count for 30 days
  @BigIntColumn({ nullable: false })
  addressCount30Days!: bigint;

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
  @Index()
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

@Entity()
export class DailyTransactionStat {
  constructor(props?: Partial<DailyTransactionStat>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  @StringColumn({ nullable: false })
  date!: string;

  @IntColumn({ nullable: false })
  transactionCount!: bigint;
}

@Entity()
export class DailyUniqueAddressStat {
  constructor(props?: Partial<DailyUniqueAddressStat>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  @StringColumn({ nullable: false })
  date!: string;

  @IntColumn({ nullable: false })
  uniqueAddressCount!: bigint;
}

@Entity()
export class DailyPriorityGasPriceStat {
  constructor(props?: Partial<DailyPriorityGasPriceStat>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  @StringColumn({ nullable: false })
  date!: string;

  @IntColumn({ nullable: false })
  transactionCount!: number;

  @BigIntColumn({ nullable: false })
  averagePriorityGasPrice!: bigint;

  @BigIntColumn({ nullable: false })
  maxPriorityGasPrice!: bigint;

  @BigIntColumn({ nullable: false })
  minPriorityGasPrice!: bigint;

  @BigIntColumn({ nullable: false })
  totalPriorityGasPrice!: bigint;
}

@Entity()
export class TransactionFeeStat {
  constructor(props?: Partial<TransactionFeeStat>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  // network transactions fee
  @BigIntColumn({ nullable: false })
  networkTransactionsFee!: bigint;

  // // total gas price
  // @BigIntColumn({ nullable: false })
  // totalGasPrice!: bigint;

  // // total tx count
  // @BigIntColumn({ nullable: false })
  // totalTxCount!: bigint;

  // // average gas price
  // @BigIntColumn({ nullable: false })
  // averageGasPrice!: bigint;
}