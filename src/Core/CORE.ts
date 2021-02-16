import { BASE } from "../Base/base";
import { flatKeyedParser, newLinesify, newLinesParse, spacesParse } from "../Base/parser";

export class CORE extends BASE {
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
    async events(): Promise<{ populated: number, frozen: number }> {
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
     * Get max depth of this cgroup
     */
    maxDepth(): Promise<number | 'max'>
    /**
     * Set max depth of this cgroup
     * 
     * @param value a integer number or 'max'
     */
    maxDepth(value: number | 'max'): Promise<number | 'max'>
    async maxDepth(value?: number | 'max'): Promise<number | 'max'> {
        if (value != undefined) {
            if (value != 'max' || !(Number(value) >= 0 && Number.isInteger(value))) throw new Error('Value must be \'max\' or a natural number')
            await this.writeInterface('cgroup.max.depth', String(value))
        }
        return this.readInterface('cgroup.max.depth')
            .then(data => {
                if (data == 'max') return data
                else return Number(data)
            })
    }


        /**
     * Get max decendants of this cgroup
     */
    maxDescendants(): Promise<number | 'max'>
    /**
     * Set max descendants of this cgroup
     * 
     * @param value a integer number or 'max'
     */
    maxDescendants(value: number | 'max'): Promise<number | 'max'>
    async maxDescendants(value?: number | 'max'): Promise<number | 'max'> {
        if (value != undefined) {
            if (value != 'max' || !(Number(value) >= 0 && Number.isInteger(value))) throw new Error('Value must be \'max\' or a natural number')
            await this.writeInterface('cgroup.max.descendants', String(value))
        }
        return this.readInterface('cgroup.max.descendants')
            .then(data => {
                if (data == 'max') return data
                else return Number(data)
            })
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
}
