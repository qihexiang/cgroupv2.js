import { CGROUP } from './cgroup'
import { newLinesify, newLinesParse, spacesParse } from './parser'

export class FullFeatured extends CGROUP {
    /**
     * Get controllers as a array
     * 
     * @returns the array of controllers, which can include cpuset, cpu, io, memory, hugetlb and pids.
     */
    async controllers(): Promise<string[]> {
        const data = this.readInterface('cgroup.controllers')
        return data.then(spacesParse)
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

    /**
     * Get cgroup type.
     */
    type(): Promise<string>
    /**
     * Set the type of this cgroup to `threaded`
     * 
     * @param type the only valid parameter is `'threaded'`
     */
    type(type: 'threaded'): Promise<string>
    async type(type?: 'threaded'): Promise<string> {
        if (type) {
            await this.writeInterface('cgroup.type', type)
        }
        return this.readInterface('cgroup.type')
    }

    /**
     * Get subtree_control from `cgroup.subtree_control`
     */
    subtreeControl(): Promise<string[]>
    /**
     * Set subtree_control by writing into `cgroup.subtree_control`
     * 
     * @param statement content to be wrote to the `cgroup.subtree_control`, like `'+cpu +memory -io'`
     */
    subtreeControl(statement: string): Promise<string[]>
    async subtreeControl(statement?: string): Promise<string[]> {
        if (statement) {
            const data = statement + '\n'
            await this.writeInterface('cgroup.subtree_control', data)
        }
        const data = this.readInterface('cgroup.subtree_control')
        return data.then(spacesParse)
    }
}