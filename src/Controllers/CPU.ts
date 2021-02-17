import { BASE } from '../Base/base'
import { flatKeyedParser } from '../Base/parser';

interface cpuStat {
    usage_usec: number
    user_usec: number
    system_usec: number
    nr_periods: number | undefined
    nr_throttled: number | undefined
    throttled_usec: number | undefined
}

export class CPU extends BASE {
    async stat(): Promise<cpuStat> {
        return this.readInterface('cpu.stat')
            .then(flatKeyedParser)
            .then(data => {
                function check(propName: string): number|undefined {
                    if(data[propName] != undefined) return Number(data[propName])
                    else return undefined
                }
                return {
                    usage_usec: Number(data['usage_usec']),
                    user_usec: Number(data['user_usec']),
                    system_usec: Number(data['system_usec']),
                    nr_periods: check('nr_periods'),
                    nr_throttled: check('nr_throttled'),
                    throttled_usec: check('throttled_usec')
                }
            })
    }
}