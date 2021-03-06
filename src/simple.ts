import * as fdb from 'foundationdb';

export function currentTime() {
    let t = process.hrtime();
    return ((t[0] * 1e9) + t[1]) / 1000000;
}

(async () => {
    fdb.setAPIVersion(620);
    let db = fdb.open();
    let dir = await fdb.directory.createOrOpen(db, ['fdb-benchmark']);
    let sp = db.at(dir)
        .withKeyEncoding(fdb.encoders.tuple)
        .withValueEncoding(fdb.encoders.string);
    let start = currentTime();
    let pending: Promise<void>[] = [];
    for (let j = 0; j < 1000; j++) {
        pending.push(sp.doTn(async txn => {
            let pk: Promise<string | undefined>[] = [];
            for (let i = 0; i < 400; i++) {
                pk.push(txn.get([i]));
            }
            await Promise.all(pk);
        }));
    }
    await Promise.all(pending);
    let delta = currentTime() - start;
    console.warn(delta + ' ms');
})();