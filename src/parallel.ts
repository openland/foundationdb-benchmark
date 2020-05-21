import * as fdb from 'foundationdb';
// let loopLag = require('event-loop-lag')(100);
// setInterval(() => {
//     console.log(loopLag());
// }, 100);

export function currentTime() {
    let t = process.hrtime();
    return ((t[0] * 1e9) + t[1]) / 1000000;
}

(async () => {
    try {
        fdb.configNetwork({
            callbacks_on_external_threads: true
        })
        fdb.setAPIVersion(620);
        let dbs: fdb.Database<fdb.TupleItem[], fdb.TupleItem[], string, string>[] = [];
        for (let k = 0; k < 1; k++) {
            let db = fdb.open();
            let dir = await fdb.directory.createOrOpen(db, ['fdb-benchmark']);
            let sp = db.at(dir)
                .withKeyEncoding(fdb.encoders.tuple)
                .withValueEncoding(fdb.encoders.string);
            dbs.push(sp);
        }
        let start = currentTime();
        let pending: Promise<void>[] = [];
        for (let k = 0; k < dbs.length; k++) {
            let sp = dbs[k];
            // let rw = await sp.doTn(async txn => {
            //     return txn.getReadVersion();
            // })
            for (let j = 0; j < 100; j++) {
                pending.push(sp.doTn(async txn => {
                    // txn.setReadVersion(rw);
                    // let start1 = currentTime();
                    // await txn.getReadVersion();
                    // console.log('rw: ' + (currentTime() - start1) + ' ms');

                    // let start1 = currentTime();
                    // let pk: Promise<string | undefined>[] = [];
                    for (let i = 0; i < 1000; i++) {
                        await txn.get([i]);
                        // pk.push(txn.get([i]));
                    }
                    // await Promise.all(pk);
                    // console.log('rw: ' + (currentTime() - start1) + ' ms');
                }));
            }
        }
        await Promise.all(pending);
        let delta = currentTime() - start;
        console.warn(delta + ' ms');
    } catch (e) {
        console.warn(e);
        throw e;
    }
})();