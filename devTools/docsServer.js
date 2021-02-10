const Koa = require('koa')
const { join } = require('path')
const mime = require('mime')
const { stat } = require('fs/promises')
const { createReadStream } = require('fs')
const { watch } = require('chokidar')
const { spawn } = require('child_process')

const app = new Koa()

const watcher = watch([join(process.cwd(), 'src'), join(process.cwd(), 'README.md')])
watcher.on('change', (path, stats) => {
    console.log(`${path} changed.`)
    const rebuild = spawn('typedoc', ['src/index.ts'])
    rebuild.stdin.pipe(process.stdin)
    rebuild.stderr.pipe(process.stdout)
    rebuild.stdout.pipe(process.stdout)
})

app.use(async (ctx) => {
    try {
        const path = join(process.cwd(), 'docs', ctx.url)
        const targetStat = await stat(path)
        if (targetStat.isDirectory()) {
            const indexHTML = join(path, 'index.html')
            await stat(indexHTML)
            ctx.set('Content-Type', mime.getType(indexHTML))
            ctx.body = createReadStream(indexHTML)
        } else {
            ctx.set('Content-Type', mime.getType(path))
            ctx.body = createReadStream(path)
        }
    } catch (err) {
        ctx.status = 404
        ctx.body = '<h1>404 Not Found</h1>'
    }
})

app.listen(8888)