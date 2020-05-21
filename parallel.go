package main

import (
	"fmt"
	"github.com/apple/foundationdb/bindings/go/src/fdb"
	"github.com/apple/foundationdb/bindings/go/src/fdb/directory"
	"github.com/apple/foundationdb/bindings/go/src/fdb/tuple"
	"log"
	"time"
)

type empty struct {}

func main() {
	fdb.MustAPIVersion(620)
	db := fdb.MustOpenDefault()

	ret, e := db.Transact(func(tr fdb.Transaction) (interface{}, error) {
		schedulingDir, err := directory.CreateOrOpen(tr, []string{"fdb-benchmark"},nil)
		if err != nil {
			log.Fatal(err)
		}
		return schedulingDir,nil
	})
	if e != nil {
		log.Fatalln(e)
	}
	dir := ret.(directory.DirectorySubspace)

	start := time.Now()
	count := 100
	reads := 1000
	sem := make(chan empty, count)
	for i := 0; i < count; i++ {
		go func () {
			_, e2 := db.Transact(func(tr fdb.Transaction) (interface{}, error) {
				sem2 := make(chan empty, reads)
				for i := 0; i < reads; i++ {
					go func (id int) {
						tr.Get(dir.Pack(tuple.Tuple{id})).MustGet()
						sem2 <- empty{}
					}(i)
				}
				for i := 0; i < reads; i++ { <-sem2 }
				return nil, nil
			})
			if e2 != nil {
				log.Fatalln(e2)
			}
			sem <- empty{}
		}()
	}

	for i := 0; i < count; i++ { <-sem }
	duration := time.Since(start)
	fmt.Println(duration.Milliseconds())

	// Database reads and writes happen inside transactions
	//ret, e := db.Transact(func(tr fdb.Transaction) (interface{}, error) {
	//	//tr.Set(fdb.Key("hello"), []byte("world"))
	//	//return tr.Get(fdb.Key("foo")).MustGet(), nil
	//	// db.Transact automatically commits (and if necessary,
	//	// retries) the transaction
	//})
	//if e != nil {
	//	log.Fatalf("Unable to perform FDB transaction (%v)", e)
	//}

	//fmt.Printf("hello is now world, foo was: %s\n", string(ret.([]byte)))
}
