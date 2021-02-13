import { mkdir, opendir, readdir } from 'fs/promises'
import { join } from 'path'
import { CORE } from './core'
import { newLinesify, newLinesParse, spacesParse } from './parser'
import { exists } from './utils'

const CGROUP_ROOT = process.env.GROUP_ROOT || '/sys/fs/cgroup'

export class FullFeatured extends CORE {
    /**
     * Create a Proc cgroup under cgroupfs root.
     * 
     * @param name the name of the cgroup, this function will create an direcotry with this name under cgroupfs root.
     */
    static async Create(name: string): Promise<FullFeatured> {
        const path = join(CGROUP_ROOT, name)
        if (await exists(path)) throw new Error(`cgroup ${name} already exists under root cgroup.`)
        else {
            await mkdir(path)
            return new FullFeatured(path)
        }
    }
    /**
     * Load an existed cgroup from specified path.
     * 
     * @param path the path of the Proc cgroup.
     */
    static async Load(path: string): Promise<FullFeatured> {
        if (await exists(path)) {
            return new FullFeatured(path)
        }
        else throw new Error(`cgroup at ${path} does't exists.`)
    }

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
    procs(...pids: number[]): Promise<number[]>
    async procs(...pids: number[]): Promise<number[]> {
        if (pids.length != 0) {
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

    /**
     * Get sub-cgroups from this subcgroup.
     */
    subCgroup(): Promise<FullFeatured[]>
    /**
     * Create a sub-cgroup under this cgroup and returns it's object
     * 
     * @param name the directory name of the subcgroup
     */
    subCgroup(name: string): Promise<FullFeatured>
    async subCgroup(name?: string): Promise<FullFeatured | FullFeatured[]> {
        if (name) {
            const subCgroupPath = join(this.CGROUP_PATH, name)
            await mkdir(subCgroupPath)
            return new FullFeatured(subCgroupPath)
        } else {
            return readdir(this.CGROUP_PATH, { withFileTypes: true })
                .then(dirents => {
                    const subCgroups: FullFeatured[] = []
                    dirents.forEach(dirent => {
                        if (dirent.isDirectory()) subCgroups.push(
                            new FullFeatured(
                                join(this.CGROUP_PATH, dirent.name)
                            )
                        )
                    })
                    return subCgroups
                })
        }
    }
}