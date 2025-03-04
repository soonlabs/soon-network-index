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

  @BigIntColumn({ nullable: false })
  txCount!: bigint;

  @BigIntColumn({ nullable: false })
  addressCount!: bigint;

  @BigIntColumn({ nullable: false })
  programCount!: bigint;
}

@Entity()
export class SoonNetworkTx {
  constructor(props?: Partial<SoonNetworkTx>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  @StringColumn({ nullable: false })
  sender!: string;

  @BigIntColumn({ nullable: false })
  computeUnit!: bigint;

  @BigIntColumn({ nullable: false })
  prioritizationGasPrice!: bigint;

  @BigIntColumn({ nullable: false })
  fee!: bigint;

  @OneToMany(() => TokenTransfer, (ele) => ele.tx)
  tokenTransfer!: bigint;

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

  @PrimaryColumn()
  id!: string;

  @BigIntColumn({ nullable: false })
  lastActiveTimestamp!: bigint;
}

@Entity()
export class SoonNetworkProgram {
  constructor(props?: Partial<SoonNetworkProgram>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

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

  @ManyToOne(() => SoonNetworkTx, (ele) => ele.txHash)
  tx!: SoonNetworkTx;

  @StringColumn({ nullable: true })
  preOwner!: string;

  @StringColumn({ nullable: true })
  postOwner!: string;

  @BigIntColumn({ nullable: true })
  preAmount!: bigint;

  @BigIntColumn({ nullable: true })
  postAmount!: bigint;

  @StringColumn({ nullable: true })
  mint!: string;
}
