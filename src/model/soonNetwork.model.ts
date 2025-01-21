import {
  BigIntColumn,
  DateTimeColumn,
  Entity,
  IntColumn,
  PrimaryColumn,
  StringColumn,
  BooleanColumn,
} from "@subsquid/typeorm-store";

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
