import { promises } from 'dns'
import { ProcCGROUP, parser } from './index'

(async function main() {
    const cgroup = await ProcCGROUP.Create('pcgroup')
    await cgroup.procs([process.pid])
    cgroup.readInterface('cpu.pressure')
        .then(parser.NestedKeyedParse)
        .then(console.log)
})().catch(console.error)