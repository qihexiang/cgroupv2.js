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
            .then(result => {
                const check = (propName: string): number | undefined => {
                    if (result[propName] === '') return undefined
                    else return Number(result[propName])
                }
                return {
                    usage_usec: Number(result['usage_usec']),
                    user_usec: Number(result['user_usec']),
                    system_usec: Number(result['system_usec']),
                    nr_periods: check('nr_periods'),
                    nr_throttled: check('nr_throttled'),
                    throttled_usec: check('throttled_usec')
                }
            })
    }
}