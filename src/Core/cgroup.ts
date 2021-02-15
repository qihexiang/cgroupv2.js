import { spawn } from "child_process";
import { mkdir, readdir, readFile } from "fs/promises";
import { join, resolve as pathResolve } from "path";
import { BASE } from "../Base/base";
import { flatKeyedParser, newLinesify, newLinesParse, spacesParse } from "../Base/parser";
import { exists } from "../Base/utils";

const CGROUP_ROOT = process.env.GROUP_ROOT || "/sys/fs/cgroup";

export class CGROUP extends BASE {
    /**
     * Get the cgroup of an existed process
     *
     * @param pid the pid of the process
     * @returns the path of the cgroup
     */
    static async GetCGROUP(pid: number): Promise<string> {
        return readFile(`/proc/${pid}/cgroup`, "utf-8").then((data) =>
            join(CGROUP_ROOT, data.split(":")[2].replace(/\n+$/, ""))
        );
    }

    /**
     * Mount cgroup v2 filesystem to specified directory and set `process.env.CGROUP_ROOT` to that directory.
     *
     * @param target the directory to mount cgroupfs.
     */
    static Mount(target: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            const mount = spawn("mount", ["-t", "cgroup2", "none", target]);
            mount.stderr.pipe(process.stdout);
            mount.stdout.pipe(process.stdout);
            mount.on("exit", (code) => {
                if (code === 0) {
                    process.env.CGROUP_ROOT = pathResolve(target);
                    resolve(true);
                } else {
                    reject(`Mount process exited with code ${code}`);
                }
            });
        });
    }
    /**
     * Umount cgroup v2 filesystem mounted to `process.env.CGROUP_ROOT`.
     */
    static Umount(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (!process.env.CGROUP_ROOT)
                reject(`No CGROUP_ROOT envrionment variate specified.`);
            const umount = spawn("umount", [String(process.env.CGROUP_ROOT)]);
            umount.stderr.pipe(process.stdout);
            umount.stdout.pipe(process.stdout);
            umount.on("exit", (code) => {
                if (code === 0) {
                    delete process.env.CGROUP_ROOT;
                    resolve(true);
                } else {
                    reject(`Umount process exited with code ${code}`);
                }
            });
        });
    }

    /**
     * Create a Proc cgroup under cgroupfs root.
     *
     * @param name the name of the cgroup, this function will create an direcotry with this name under cgroupfs root.
     */
    static async Create(name: string): Promise<CGROUP> {
        const path = join(CGROUP_ROOT, name);
        if (await exists(path))
            throw new Error(`cgroup ${name} already exists under root cgroup.`);
        else {
            await mkdir(path);
            return new CGROUP(path);
        }
    }
    /**
     * Load an existed cgroup from specified path.
     *
     * @param path the path of the Proc cgroup.
     */
    static async Load(path: string): Promise<CGROUP> {
        if (await exists(path)) {
            return new CGROUP(path);
        } else throw new Error(`cgroup at ${path} does't exists.`);
    }

    /**
     * Get controllers as a array
     *
     * @returns the array of controllers, which can include cpuset, cpu, io, memory, hugetlb and pids.
     */
    async controllers(): Promise<string[]> {
        const data = this.readInterface("cgroup.controllers");
        return data.then(spacesParse);
    }

    /**
     * Get events as a object
     */
    async events(): Promise<{populated: number, frozen: number}> {
        const data = this.readInterface('cgroup.events');
        return data
        .then(flatKeyedParser)
        .then(property => {
            return {
                populated: Number(property.popluated),
                frozen: Number(property.frozen)
            }
        })
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
     * Get pids of this cgroup from `cgroup.procs`
     *
     * @returns pids in an array
     */
    procs(): Promise<number[]>;
    /**
     * Move process into this cgroup by writing to `cgroup.procs`
     *
     * @param pids PIDs to be moved into this cgroup
     * @returns PIDs in an array
     */
    procs(...pids: number[]): Promise<number[]>;
    async procs(...pids: number[]): Promise<number[]> {
        if (pids.length != 0) {
            const data = newLinesify(pids.map(String));
            await this.writeInterface("cgroup.procs", data);
        }
        const data = this.readInterface("cgroup.procs");
        return data.then(newLinesParse).then((pids) => pids.map(Number));
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

    /**
     * Get TIDs of this cgroup from `cgroup.threads`
     *
     * @returns TIDs in an array
     */
    threads(): Promise<number[]>;
    /**
     * Move threads into this cgroup by writing to `cgroup.threads`
     *
     * @param tids TIDs to be moved into this cgroup
     * @returns TIDs in an array
     */
    threads(...tids: number[]): Promise<number[]>;
    async threads(...tids: number[]): Promise<number[]> {
        if (tids.length != 0) {
            const data = newLinesify(tids.map(String));
            await this.writeInterface("cgroup.threads", data);
        }
        const data = this.readInterface("cgroup.threads");
        return data.then(newLinesParse).then((tids) => tids.map(Number));
    }

    /**
     * Get cgroup type.
     */
    type(): Promise<string>;
    /**
     * Set the type of this cgroup to `threaded`
     *
     * @param type the only valid parameter is `'threaded'`
     */
    type(type: "threaded"): Promise<string>;
    async type(type?: "threaded"): Promise<string> {
        if (type) {
            await this.writeInterface("cgroup.type", type);
        }
        return this.readInterface("cgroup.type");
    }

    /**
     * Get subtree_control from `cgroup.subtree_control`
     */
    subtreeControl(): Promise<string[]>;
    /**
     * Set subtree_control by writing into `cgroup.subtree_control`
     *
     * @param statement content to be wrote to the `cgroup.subtree_control`, like `'+cpu +memory -io'`
     */
    subtreeControl(statement: string): Promise<string[]>;
    async subtreeControl(statement?: string): Promise<string[]> {
        if (statement) {
            const data = statement + "\n";
            await this.writeInterface("cgroup.subtree_control", data);
        }
        const data = this.readInterface("cgroup.subtree_control");
        return data.then(spacesParse);
    }

    /**
     * Get sub-cgroups from this subcgroup.
     */
    subCgroup(): Promise<CGROUP[]>;
    /**
     * Create a sub-cgroup under this cgroup and returns it's object
     *
     * @param name the directory name of the subcgroup
     */
    subCgroup(name: string): Promise<CGROUP>;
    async subCgroup(name?: string): Promise<CGROUP | CGROUP[]> {
        if (name) {
            const subCgroupPath = join(this.CGROUP_PATH, name);
            await mkdir(subCgroupPath);
            return new CGROUP(subCgroupPath);
        } else {
            return readdir(this.CGROUP_PATH, { withFileTypes: true }).then(
                (dirents) => {
                    const subCgroups: CGROUP[] = [];
                    dirents.forEach((dirent) => {
                        if (dirent.isDirectory())
                            subCgroups.push(new CGROUP(join(this.CGROUP_PATH, dirent.name)));
                    });
                    return subCgroups;
                }
            );
        }
    }
}
