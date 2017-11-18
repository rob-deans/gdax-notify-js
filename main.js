const Gdax = require('gdax')
const PushBullet = require('pushbullet')
var mongo = require('mongodb')
var Details = require('./details.json')

const pusher = new PushBullet(Details.pushbullet.key)
const URL = 'mongodb://localhost:27017/gdax'

const key = Details.gdax.key
const b64secret = Details.gdax.secret
const passphrase = Details.gdax.passphrase

const apiURI = 'https://api.gdax.com';

const authedClient = new Gdax.AuthenticatedClient(key, b64secret, passphrase, apiURI);

mongo.connect(URL, function(err, db) {
    setInterval(() => {
        authedClient.getFills((err, res, body) => {
            if(!err) {
                let cursor = db.collection('orders').find()
                let fills = []
                cursor.forEach(function(doc, err) {
                    fills.push(doc)
                }, function() {
                    // After we have the updated list of fills we check if any of the NEW ones already exist
                    JSON.parse(res.body).forEach(fill =>  {
                        let exists = false
                        fills.forEach(f => {
                            if(f.order.order_id !== fill.order_id) { 
                                exists = true
                                return
                            }
                        })
                        if(!exists) {
                            db.collection('orders').insertOne({ order: fill }, function(err, result) {
                                pusher.note(Details.pushbullet.device_id,
                                            `${fill.side=='sell' ? 'Sold' : 'Bought'} ${fill.product_id == 'ETH-EUR' ? 'Ethereum' : 'Litecoin'}!`,
                                            `${fill.side=='sell' ? 'Sold' : 'Bought'} ${fill.size} ${fill.product_id == 'ETH-EUR' ? 'Ethereum' : 'Litecoin'} @ ${fill.price}`)
                            })
                        }
                    })
                })
            }
        })
    }, 10000)
})
