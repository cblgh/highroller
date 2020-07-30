var CabalBot = require('cabal-bot-core')
var pipeline = require('cabal-bot-pipeline')

const bot = new CabalBot('kuso', { channels: ['bots'] })

let initiated = false
let maxRollers = null
let rollers // map roller : their roll 

pipeline(bot).onCommand('roll').onCommand("initiate").do((text, cabal, envelope) => {
    let response 
    maxRollers = parseInt(text)
    console.log(text)
    if (initiated) {
        response = `a round has already been initiated! it will continue until ${maxRollers} people have rolled. roll with !roll`
    } else if (isNaN(maxRollers)) { 
        response = "syntax: '!roll initiate <number of rollers>'\nnumber must be an integer"
    } else if (initiated) {
        response = `a round has already been initiated! it will continue until ${maxRollers} people have rolled. roll with !roll`
    } else {
        response = "allllllright folx get yr rolls in!\ntype !roll to roll, highest roller wins"
        initiated = true
        rollers = new Map()
    }
    console.log(response)
    bot.post(cabal, envelope.channel, response)
})

pipeline(bot).onCommand('roll').do((text, cabal, envelope) => {
    if (text.includes("initiate")) return
    let response
    const name = envelope.author.name ? envelope.author.name : envelope.author.key.slice(0, 8)
    if (!initiated) {
        response = "initiate a new round with !roll initiate <number of rollers>"
        return bot.post(cabal, envelope.channel, response)
    }
    if (rollers.has(envelope.author.key)) { 
        response = `${name} you already rolled..`
        return bot.post(cabal, envelope.channel, response)
    }
    const roll = Math.floor(Math.random() * 101)
    response = `${name} rolled ${roll}` 
    rollers.set(envelope.author.key, roll)
    if (rollers.size >= maxRollers) {  
        let highroller // { roll, key }
        rollers.forEach((roll, key) => { 
            if (!highroller) { highroller = { roll, key }} 
            if (roll > highroller.roll) { highroller = { roll, key }}
        })
        const winner = cabal.getUsers()[highroller.key]
        response = `${winner.name ? winner.name : winner.key.slice(0, 8)} won with ${highroller.roll}${"!".repeat(Math.floor(Math.random() * 7 + 1))}`
        reset()
    }
    bot.post(cabal, envelope.channel, response)
})

function reset () {
    initiated = false
    rollers = null
    maxRollers = null
}

if (process.argv.length < 3) {
    console.log("bot: please give me a cabal:// key to join")
    process.exit()
}
bot.joinCabal(process.argv[2])
