import IPFS from 'ipfs'
import OrbitDB from 'orbit-db'

const createOrbitDBVuexPlugin = async function (ipfsConfig) {
  this.config = ipfsConfig;

  const ipfs = new IPFS({ ...ipfsConfig });
  console.log('Installing OrbitDB ...')

  function createDB() {
    return new Promise((resolve, reject) => {
      ipfs.on('error', e => reject(e))
      ipfs.on('ready', async () => {
        // Create a database
        const orbitdb = new OrbitDB(ipfs)
        const db = await orbitdb.keyvalue('broampSharedStore')

        console.log("orbit db ready:", db);
        resolve(db);
      })
    })
  }

  try {
    const db = await createDB();
    return (store) => {

      db.events.on('replicated', (address) => {
        console.log('replicated');
        console.log(address);
        const audioSrc = db.get('audioSrc');
        console.log(audioSrc);
      });

      db.events.on('write', (dbname, hash, entry) => {
        console.log(dbname, hash, entry);
      })

      store.subscribe(mutation => {
        switch (mutation.type) {
          case ('broadcastAudioSrc'):
            console.log('broadcastAudioSrc subs', mutation.payload);
            db.set('audioSrc', mutation.payload);
            return;
          case ('broadcastAudioStatus'):
            console.log('broadcastAudioStatus subs');
            db.set('audioStatus', mutation.payload);
            return;
          case ('broadcastPlay'):
            console.log('broadcastPlay subs');
            db.set('audioPaused', false);
            return;
          case ('broadcastPause'):
            console.log('broadcastPause subs');
            db.set('audioPaused', true);
            return;
          default:
          // do nothing.
        }
      });
    }
    console.log('OrbitDB installed ...')

    // return {
    //   get(query) {
    //     return db.get(query);
    //   },
    //   put(doc) {
    //     return db.put(doc);
    //   },
    //   onReplicated: async (callback) => {
    //     return db.events.on('replicated', callback)
    //   },
    // }
  } catch (e) {
    console.log(e, 'Error installing orbit-db plugin...')
  }
}

module.exports = { createOrbitDBVuexPlugin };
