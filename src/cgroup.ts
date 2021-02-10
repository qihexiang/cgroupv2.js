import { spawn } from 'child_process'
import { readFile } from 'fs/promises'
import { join, resolve as pathResolve } from 'path'
import { BASE_CGROUP } from './base'
import { flatKeyedParser } from './parser'

const CGROUP_ROOT = process.env.CGROUP_ROOT || '/sys/fs/cgroup/'

export abstract class CGROUP extends BASE_CGROUP {
    /**
     * Get the cgroup of an existed process
     * 
     * @param pid the pid of the process
     * @returns the path of the cgroup
     */
    static async GetCGROUP(pid: number): Promise<string> {
        return readFile(`/proc/${pid}/cgroup`, 'utf-8')
            .then(data => join(CGROUP_ROOT, data.split(':')[2].replace(/\n+$/, '')))
    }
    /**
     * Mount cgroup v2 filesystem to specified directory and set `process.env.CGROUP_ROOT` to that directory.
     * 
     * @param target the directory to mount cgroupfs.
     */
    static Mount(target: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const mount = spawn('mount', ['-t', 'cgroup2', 'none', target])
            mount.stderr.pipe(process.stdout)
            mount.stdout.pipe(process.stdout)
            mount.on("exit", code => {
                if (code === 0) {
                    process.env.CGROUP_ROOT = pathResolve(target)
                    resolve(true)
                } else {
                    reject(`Mount process exited with code ${code}`)
                }
            })
        })
    }
    /**
     * Umount cgroup v2 filesystem mounted to `process.env.CGROUP_ROOT`.
     */
    static Umount(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!process.env.CGROUP_ROOT) reject(`No CGROUP_ROOT envrionment variate specified.`)
            const umount = spawn('umount', [String(process.env.CGROUP_ROOT)])
            umount.stderr.pipe(process.stdout)
            umount.stdout.pipe(process.stdout)
            umount.on("exit", code => {
                if (code === 0) {
                    delete process.env.CGROUP_ROOT
                    resolve(true)
                } else {
                    reject(`Umount process exited with code ${code}`)
                }
            })
        })
    }

    /**
     * Get type of this cgroup
     */
    type(): Promise<string>
    async type(): Promise<string> {
        return this.readInterface('cgroup.type')
    }

    /**
     * Get freeze status
     * 
     * @returns if true returns 1, otherwise returns 0
     */
    freeze(): Promise<number>
    /**
     * Set freeze status
     * 
     * @param status to freeze the cgroup by writing 1, to thaw it by write 0
     * @returns the freeze status as 0 or 1
     */
    freeze(status: number): Promise<number>
    async freeze(status?: number): Promise<number> {
        if (status != undefined) {
            const data = String(status) + '\n'
            await this.writeInterface('cgroup.freeze', data)
        }
        const data = this.readInterface('cgroup.freeze')
        return data.then(Number)
    }

    /**
     * Get stat of this cgroup.
     */
    async stat(): Promise<{
        nr_descendants: number,
        nr_dying_descendants: number
    }> {
        return this.readInterface('cgroup.stat')
            .then(flatKeyedParser)
            .then(property => {
                return {
                    nr_descendants: Number(property.nr_descendants),
                    nr_dying_descendants: Number(property.nr_dying_descendants)
                }
            })
    }
}