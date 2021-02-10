import { CGROUP } from './cgroup'
import { spacesParse } from './parser'

export class NoProcsDomain extends CGROUP {
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