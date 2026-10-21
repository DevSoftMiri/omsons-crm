import { BullModule, Processor, WorkerHost } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import type { Job } from "bullmq";

@Processor("reminders")
export class ReminderProcessor extends WorkerHost {
  async process(job: Job) {
    return { processed: true, name: job.name, data: job.data };
  }
}

@Module({
  imports: [BullModule.registerQueue({ name: "reminders" })],
  providers: [ReminderProcessor],
  exports: [BullModule]
})
export class ReminderQueueModule {}
