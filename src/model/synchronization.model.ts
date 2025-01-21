import {
  BigIntColumn,
  DateTimeColumn,
  Entity,
  IntColumn,
  PrimaryColumn,
  StringColumn,
} from "@subsquid/typeorm-store";

@Entity()
export class SyncrhonizationStatus {
  constructor(props?: Partial<SyncrhonizationStatus>) {
    Object.assign(this, props);
  }

  @PrimaryColumn()
  id!: string;

  @BigIntColumn({ nullable: false })
  slot!: bigint;

  @DateTimeColumn({ nullable: false })
  timestamp!: Date;

  @BigIntColumn({ nullable: false })
  blockNumber!: bigint;
}
