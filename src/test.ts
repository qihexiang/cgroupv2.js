import cluster from 'cluster'
import http from 'http'
import { FullFeatured } from './FullFeatured';
import { FullFeatured as CGROUP } from './index'

const instaces = 4;

(async function main() {
    await FullFeatured.Mount('./tmp')
    if (cluster.isMaster) {
        const [cgroup, originCG] = await Promise.all([
            CGROUP.Create('ffcgroup'),
            CGROUP.Load(await CGROUP.GetCGROUP(process.pid))
        ])
        // Move master process to target cgroup
        await cgroup.procs(process.pid)
            .then(pids => {
                // Fork workers in new cgroup
                for (let i = 0; i < instaces; i++) {
                    cluster.fork();
                }
                return pids
            })
        // Move master process back to original cgroup
        await originCG.procs(process.pid)
        // Get info from cgroup
        Promise.all(
            [cgroup.type(), cgroup.controllers(), cgroup.procs(), cgroup.stat()]
        ).then(results => console.log(results))
        // freeze the cgroup after 10 seconds
        setTimeout(() => {
            cgroup.freeze(1)
        }, 10000)
        // thaw the cgroup after 30 seconds
        setTimeout(() => {
            cgroup.freeze(0)
        }, 30000)
        console.log(`Master process ${process.pid} is running in ${await CGROUP.GetCGROUP(process.pid)}`)
    } else {
        http.createServer((req, res) => {
            res.writeHead(200);
            res.end('hello world\n');
        }).listen(8000);

        console.log(`Worker ${process.pid} started ${await CGROUP.GetCGROUP(process.pid)}`);
    }
})().catch(console.error)