import { BigInt } from "@graphprotocol/graph-ts"
import {
    RenderToken,
    JobBalanceUpdate,
    DisburseJobCall
} from "../generated/RenderToken/RenderToken"
import { Job, Worker, WorkerJob } from "../generated/schema"

export function handleJobBalanceUpdate(event: JobBalanceUpdate): void {
    let entity = Job.load(event.params._jobId)
    
    if (entity == null) {
	entity = new Job(event.params._jobId)
	entity.paid = BigInt.fromI32(0)
	entity.funded = BigInt.fromI32(0)
    }

    let balance = entity.funded - entity.paid
    
    if (event.params._balance > balance) {
	entity.funded += event.params._balance - balance
    } else {
	entity.paid += balance - event.params._balance;
    }
    
    entity.save()
}

export function handleDisburseJob(call: DisburseJobCall): void {
    let job = Job.load(call.inputs._jobId)

    let recipients = call.inputs._recipients
    let amounts = call.inputs._amounts

    for (let i = 0; i < recipients.length; i++) {
	let worker = Worker.load(recipients[i].toHex())
	
	if (worker == null) {
	    worker = new Worker(recipients[i].toHex())
	    worker.earned = BigInt.fromI32(0)
	}

	let workerjob = WorkerJob.load(`${worker.id}-${job.id}`)

	if (workerjob == null) {
	    workerjob = new WorkerJob(`${worker.id}-${job.id}`)
	    workerjob.job = job.id
	    workerjob.worker = worker.id
	    workerjob.paid = BigInt.fromI32(0)
	}

	worker.earned += amounts[i]
	workerjob.paid += amounts[i]

	worker.save()
	workerjob.save()
    }
}
