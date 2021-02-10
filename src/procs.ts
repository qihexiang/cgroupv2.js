import { mkdir } from 'fs/promises'
import { join } from 'path'
import { CGROUP } from './cgroup'
import { newLinesify, newLinesParse, spacesParse } from './parser'
import { exists } from './utils'

const CGROUP_ROOT: string = process.env.CGROUP_ROOT || '/sys/fs/cgroup/'

export class ProcCGROUP extends CGROUP {
    /**
     * Create a Proc cgroup under cgroupfs root.
     * 
     * @param name the name of the cgroup, this function will create an direcotry with this name under cgroupfs root.
     */
    static async Create(name: string): Promise<ProcCGROUP> {
        const path = join(CGROUP_ROOT, name)
        if (await exists(path)) throw new Error(`cgroup ${name} already exists under root cgroup.`)
        else {
            await mkdir(path)
            return new ProcCGROUP(path)
        }
    }
    /**
     * Load an existed cgroup from specified path.
     * 
     * @param path the path of the Proc cgroup.
     */
    static async Load(path: string): Promise<ProcCGROUP> {
        if (await exists(path)) {
            const cgroup = new ProcCGROUP(path)
            return cgroup
        }
        else throw new Error(`cgroup at ${path} does't exists.`)
    }

    /**
     * Get pids of this cgroup from `cgroup.procs`
     * 
     * @returns pids in an array
     */
    procs(): Promise<number[]>
    /**
     * Move PIDs into this cgroup by writing to `cgroup.procs`
     * 
     * @param pids PIDs to be moved into this cgroup
     * @returns pids in an array
     */
    procs(pids: number[]): Promise<number[]>
    async procs(pids?: number[]): Promise<number[]> {
        if (pids) {
            const data = newLinesify(pids.map(String))
            await this.writeInterface('cgroup.procs', data)
        }
        const data = this.readInterface('cgroup.procs')
        return data.then(newLinesParse).then(pids => pids.map(Number))
    }
}