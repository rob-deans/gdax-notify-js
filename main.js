const Gdax = require('gdax')
const PushBullet = require('pushbullet')
var Details = require('./details.json')

const pusher = new PushBullet(Details.pushbullet.key)

const key = Details.gdax.key
const b64secret = Details.gdax.secret
const passphrase = Details.gdax.passphrase

const apiURI = 'https://api.gdax.com';

const authedClient = new Gdax.AuthenticatedClient(key, b64secret, passphrase, apiURI);

let knownFills = []

// Initial fills thing to determine whether or not we have already sent a notification
authedClient.getFills((err, res, body) => {
    JSON.parse(res.body).forEach(fill => {
        knownFills.push(fill.order_id)
    });
})

while(true) {
    setTimeout(function() {
        authedClient.getFills((err, res, body) => {
            JSON.parse(res.body).forEach(fill => {
                if(knownFills.indexOf(fill.order_id) < 0) {
                    // Send notification

                    pusher.note(Details.pushbullet.device_id,
                     `${fill.side=='sell' ? 'Sold' : 'Bought'} ${fill.product_id == 'ETH-EUR' ? 'Ethereum' : 'Litecoin'}!`,
                     `${fill.side=='sell' ? 'Sold' : 'Bought'} ${fill.size} ${fill.product_id == 'ETH-EUR' ? 'Ethereum' : 'Litecoin'} @ ${fill.price}`)
    
                    // Add it to the know fills
                    knownFills.push(fill.order_id)
                }
            })
        })
    }, 1000)
}
